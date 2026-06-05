# TASK1_EXPLAIN

## 1. What You Have Done (The How)

- Implementation details: reviewed authentication/session handling, OAuth callbacks, OTP verification, merchant onboarding, Prisma persistence, and affected frontend login flows.
- Implementation details: traced each finding from controller/guard/service to frontend consumer or UI call site when the issue crossed layers.
- Pattern adherence: checked the current module -> controller -> service -> guard flow and focused on places where the implementation breaks the intended security or business-flow boundaries.
- Testing and verification: findings below are based on direct code-path inspection with exact file and line references. I did not execute the full automated test suite in this pass.

## 2. Critical Issues Review

### Finding 1: Critical - OAuth callback leaks access tokens and user data in URL query parameters

- Files / lines:
  - `api-service/src/app/auth/auth.controller.ts`: 50, 52, 59, 175, 203-205, 312, 341-343
  - `front-management/src/app/pages/login/login.component.ts`: 74, 79
  - `front-b2b/src/app/pages/auth/login/login.component.ts`: 74, 79
- What breaks in production:
  - Access tokens are exposed in browser history, reverse proxy logs, analytics tools, crash reports, and Referrer headers.
  - User profile and permissions are leaked alongside the token.
- Why this is serious:
  - Any party that can read these logs or URLs can replay the bearer token until it expires.
  - Because the redirect target is built from the `Host` header, a proxy or routing misconfiguration can leak the token to the wrong domain.
- Concrete fix:
  - Do not put access tokens in the redirect URL.
  - Use a one-time authorization code or state token, then let the frontend exchange it on a secure backend endpoint.
  - Keep session persistence in `httpOnly` cookies only.
- Exploit scenario:
  - An attacker with access to CDN, Nginx, browser-history sync, or analytics events can recover the bearer token from the callback URL and impersonate the user.

### Finding 2: Major - Refresh failure does not actually log the user out

- Files / lines:
  - `shared/src/lib/interceptors/auth.interceptor.ts`: 55
  - `shared/src/lib/services/auth.service.ts`: 89-91
- What breaks in production:
  - When refresh fails, the UI keeps stale auth state in memory.
  - The app can remain in a broken semi-authenticated state and continue sending invalid bearer tokens.
- Why this is serious:
  - Users see repeated 401 failures instead of a clean redirect to re-authenticate.
  - The frontend state no longer reflects the backend session state, which makes incident handling and support harder.
- Concrete fix:
  - Make local auth cleanup synchronous, or subscribe/chain the logout observable inside the interceptor error path.
  - Add a regression test that verifies refresh failure clears `accessToken`, `currentUser`, and `permissions`.

### Finding 3: Major - OTP verification tokens are reusable during their lifetime

- Files / lines:
  - `api-service/src/app/otp/otp.service.ts`: 49, 51, 54-55
  - `api-service/src/app/agency/agency.service.ts`: 116, 123, 127, 131
  - `api-service/src/app/merchant/merchant.service.ts`: 249, 256, 260, 264
- What breaks in production:
  - A single successful OTP verification can be reused multiple times within 15 minutes to create repeated agency or merchant registrations.
- Why this is serious:
  - The database record is marked verified, but the issued JWT only contains `phone` and `type`; it does not reference the consumed OTP record or any one-time identifier.
  - The create endpoints only verify signature, phone, and type, so replayed tokens remain valid until expiry.
- Concrete fix:
  - Include `otpVerificationId` or `jti` in the verification token.
  - Consume that identifier atomically during agency or merchant creation in a transaction.
  - Reject any already-consumed token on subsequent use.
- Exploit scenario:
  - A user or attacker can complete OTP once, script repeated POST requests with the same `verificationToken`, and create many duplicate pending entities before the token expires.
- Layers involved:
  - Backend OTP issuance -> backend registration endpoints -> frontend self-registration flows.

### Finding 4: Major - Admin merchant creation produces an account that the merchant cannot access

- Files / lines:
  - `api-service/src/app/merchant/merchant.service.ts`: 318, 320, 365, 368
  - `front-management/src/app/pages/partners/merchants/merchants.component.ts`: 351, 362, 381
- What breaks in production:
  - The management UI reports merchant creation success, but the newly created merchant owner never receives the temporary password or any activation path.
- Why this is serious:
  - This is a dead-end onboarding flow. Admins think the account is ready, but the merchant cannot log in.
- Concrete fix:
  - Replace the hidden temporary password with a proper account-activation or password-set flow.
  - At minimum, return a one-time setup link or send a welcome email before returning success to the UI.
  - Add an end-to-end test that creates a merchant and verifies the owner can complete first login.

### Finding 5: Major - Third-party OAuth access and refresh tokens are stored in plaintext

- Files / lines:
  - `prisma/schema.prisma`: 50-51
  - `api-service/src/app/auth/auth.service.ts`: 311-312, 393-394, 521-522
- What breaks in production:
  - A database dump or unintended read access exposes live Google and Kakao tokens, not just local application credentials.
- Why this is serious:
  - Compromise now extends beyond this application and can allow external API access or token refresh against the OAuth provider.
- Concrete fix:
  - Do not store provider access or refresh tokens unless the product truly needs them later.
  - If storage is required, encrypt them at the application layer with a managed key and restrict read paths.
- Exploit scenario:
  - An attacker who gains read access to the `linked_accounts` table can reuse those provider tokens outside the platform.

### Finding 6: Major - OTP values are logged in plaintext

- Files / lines:
  - `api-service/src/app/otp/otp.service.ts`: 20
- What breaks in production:
  - Anyone with access to application logs can bypass phone verification and complete registration flows.
- Why this is serious:
  - Logs are often broadly accessible across ops, support, or observability systems.
- Concrete fix:
  - Remove OTP logging entirely from shared or production code paths.
  - If temporary debugging is unavoidable, gate it behind an explicit local-only debug flag and mask sensitive values.
- Exploit scenario:
  - A support or infrastructure user can read the latest OTP from logs and complete merchant or agency registration without controlling the phone number.

## 3. Top 3 Issues and Justification

1. OAuth callback token leakage is the highest-risk issue because it exposes bearer tokens across multiple infrastructure layers that are not designed to protect secrets.
2. Reusable verification tokens are next because they break the one-time guarantee of the registration flow and allow repeat abuse with very low effort.
3. Plaintext storage of provider tokens is third because a database read leak becomes an external account and token-compromise problem, not only an internal application problem.

## 4. Issues Spanning Multiple Layers

- OAuth callback leakage spans backend controller logic, frontend login handlers, browser URL handling, and proxy or logging infrastructure.
- Refresh-failure logout bug spans the shared frontend interceptor and auth-state service, and directly affects how backend refresh failures surface in the UI.
- OTP replay spans OTP issuance, backend registration endpoints, and frontend self-registration flows that depend on `verificationToken`.

## 5. Proposed CI/CD Checks

- Add an integration test asserting OAuth callbacks never place `access_token` or user payloads in redirect URLs.
- Add replay tests asserting a `verificationToken` can be used only once for agency and merchant registration.
- Add static analysis or lint rules that block console logging of OTPs or tokens and block direct persistence of provider tokens outside an approved encryption helper.
- Add a high-level onboarding test for admin merchant creation to verify the owner receives a usable activation path.

## 6. One-Week Sprint Plan

- Day 1:
  - Remove OAuth token leakage from redirect URLs.
  - Add regression tests for callback behavior.
- Day 2:
  - Redesign OTP verification tokens as one-time consumable artifacts.
  - Patch agency and merchant creation flows to consume tokens transactionally.
- Day 3:
  - Fix frontend auth refresh-failure handling and add unit tests for state clearing.
- Day 4:
  - Replace admin merchant temporary-password dead end with an activation or password-set flow.
- Day 5:
  - Remove OTP plaintext logging and stop storing provider tokens in plaintext; add encryption or eliminate persistence entirely.
- Day 6:
  - Add CI/CD rules and security-focused regression tests.
- Day 7:
  - Run end-to-end verification, update documentation, and prepare PR notes.

## 7. Technical Justification (The Why)

- Decision making:
  - I prioritized issues that can directly cause credential leakage, broken authentication state, or failed onboarding in production.
- Security and stability:
  - The highest-severity findings are the ones that either expose secrets (OAuth URL leakage, plaintext provider tokens, OTP log leakage) or violate core business invariants (one-time OTP usage, successful merchant onboarding).
- Engineering trade-offs:
  - I intentionally did not include lower-confidence style or maintainability issues. The selected findings all have a concrete production failure mode, a direct code path, and a clear remediation direction.

## 8. Testing and Verification Notes

- This review was performed through static code-path inspection.
- I traced backend controller and service logic into the affected frontend consumers where the issue crossed layers.
- I did not execute the full automated test suite in this pass.
- Recommended manual verification after fixes:
  - Complete Google or Kakao login and confirm the callback URL contains no tokens or user payloads.
  - Attempt to reuse the same `verificationToken` twice and confirm the second request fails.
  - Force refresh-token expiry and confirm the UI clears auth state and redirects to login.
  - Create a merchant from management UI and confirm the merchant owner can complete first-time account setup.
