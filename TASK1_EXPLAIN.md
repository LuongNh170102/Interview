# TASK 1 – Code Review & Critical Issue Analysis

## Methodology

This review was conducted through:
- Static analysis of the source code across all layers (backend NestJS, frontend Angular, database schema)
- Manual trace of authentication and OTP flows to identify data exposure points
- Inspection of environment configuration files and secrets management
- Review of Prisma schema definitions against actual usage patterns in service code
- Analysis of frontend routing configuration and authorization guard coverage

## Severity Classification

| Severity | Definition |
|----------|-----------|
| **Critical** | Direct security vulnerability or guaranteed production outage. Requires immediate remediation before deployment. |
| **Major** | Significant production risk: performance degradation, data exposure, or authentication bypass potential. Should be addressed in the current sprint. |
| **Minor** | Code quality or operational concern. Low immediate risk but indicates technical debt that should be resolved within 1-2 sprints. |

---

## Risk Impact Matrix

| ID | Issue | Severity | Exploit Likelihood | Impact if Exploited | Difficulty to Fix |
|----|-------|----------|-------------------|---------------------|------------------|
| #1 | OAuth token in URL | Critical | High | Account takeover | Medium (2-4h) |
| #2 | Auto-migration on startup | Critical | High (production deploy) | Full downtime | Low (30min) |
| #3 | JWT secret corrupted | Critical | Medium | Auth failure across environments | Low (5min) |
| #4 | No rate limiting | Major | High | Account brute force | Low (1-2h) |
| #5 | Permissions DB query per request | Major | Medium (at scale) | Performance degradation | Medium (4-6h) |
| #6 | OAuth tokens plaintext in DB | Major | Low (DB breach) | Third-party API access | Medium (2-3h) |
| #7 | Frontend guards commented out | Major | Medium | Unauthorized page access | Low (30min) |
| #8 | Math.random() for passwords | Major | Low | Predictable passwords | Low (15min) |
| #9 | Refresh token race condition | Major | Medium | Session hijacking | Medium (3-4h) |
| #10 | OTP in console logs | Minor | Low (log access) | OTP leakage | Low (5min) |
| #11 | `as any` type casts | Minor | Low | Type safety erosion | Medium (ongoing) |
| #12 | SameSite inconsistency | Minor | Low | CSRF exposure | Low (30min) |

---

## Critical Issues

### #1 — OAuth2 Access Token Exposed in URL Query Parameters

**Location:** `auth.controller.ts` (Google callback ~line 200, Kakao callback ~line 230)

**Observation:**
Both OAuth callback handlers construct a redirect URL containing the JWT access token as a query parameter:

```ts
const params = new URLSearchParams({
  success: 'true',
  access_token: successResult.access_token,
  user: JSON.stringify(successResult.user),
  permissions: JSON.stringify(successResult.permissions),
});
return res.redirect(`${frontendUrl}/login?${params.toString()}`);
```

**Exploit Scenarios:**

1. **Browser history leakage:** A user authenticates via Google on a shared/public computer. The redirect URL containing the access token is persisted in browser history. Any subsequent user with access to that machine can open the browser history and extract the token, gaining full access to the original user's account.

2. **Referer header leakage:** The redirect URL navigates to the frontend application. If the frontend page loads third-party resources (analytics scripts, CDN assets, advertising pixels), the browser automatically sends the `Referer` header containing the full URL—including the access token—to these external services.

3. **Server-side log exposure:** Both the backend server (302 redirect) and the frontend web server (landing page) may log the full request URL. Access tokens captured in log aggregation tools (CloudWatch, DataDog, ELK) are accessible to anyone with log access, including contractors and support staff.

4. **Screen-sharing / screenshot:** A developer or admin sharing their screen during a demo or debugging session inadvertently displays the URL bar containing the token. Anyone viewing the recording or screenshot can capture the credential.

**Cross-layer impact:** This vulnerability spans the API gateway, backend authentication service, and frontend routing. The issue originates in the backend controller but its exploits manifest primarily at the browser/network layer (history, referrer, logs).

**Recommended Fix:**
Replace URL-based token transmission with httpOnly cookies, consistent with the existing refresh token handling:

```ts
res.cookie('access_token', successResult.access_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000,
});
return res.redirect(`${frontendUrl}/login`);
```

**Trade-off:** Using httpOnly cookies prevents the frontend JavaScript from accessing the token directly, which requires the frontend to rely on cookie-based authentication or implement a token exchange mechanism. The frontend must also be configured to send credentials (`withCredentials: true`) on API requests.

---

### #2 — Database Migration Execution During Application Startup

**Location:** `prisma.service.ts` in `onModuleInit()`

**Observation:**
The application executes `npx prisma migrate deploy` synchronously during the NestJS module initialization phase:

```ts
async onModuleInit() {
  await this.$connect();
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }
}
```

**Exploit Scenario:**

1. **Rolling deployment failure:** In a Kubernetes deployment with rolling updates, old pods continue serving traffic while new pods start up. The new pod applies a migration (e.g., adding a NOT NULL column), which immediately breaks the old pod's database queries. This results in partial service outage—some requests succeed, others fail with schema errors.

2. **Migration rollback impossibility:** If a migration contains a destructive operation (e.g., DROP COLUMN), and the migration fails partway through, there is no automated rollback mechanism. The database may be left in an inconsistent state with no clear path to recovery.

3. **Pod restart cascade:** If Kubernetes automatically restarts a failing pod, the restart triggers `onModuleInit()` again, which re-runs the migration. While Prisma marks completed migrations, the repeated `execSync` calls delay pod readiness, extending the restart cycle.

4. **Blocked health checks:** `execSync` blocks the Node.js event loop. If a migration takes 30 seconds, the application's health check endpoint (`/health`) is unresponsive for that duration. Kubernetes may interpret this as pod failure and forcibly restart it before the migration completes.

**Recommended Fix:**
Remove the migration execution from application code entirely. Migrations should be executed as a separate CI/CD step before deployment:

```yaml
# CI/CD pipeline step (run before deploying new version)
- name: Run database migrations
  run: npx prisma migrate deploy
```

For local development, use an async `exec` wrapper to avoid blocking the event loop:

```ts
import { exec } from 'child_process';
import { promisify } from 'util';
const asyncExec = promisify(exec);

// In a dedicated script, not in app startup
```

---

### #3 — Malformed JWT Secret Values in Environment Configuration

**Location:** `.env` files (root and environment-specific)

**Observation:**
Both JWT secrets contain an unmatched trailing double-quote character:

```
JWT_SECRET=ghjrfofdifudjofidfjdkfvneiruejr24i8349475"
JWT_REFRESH_SECRET=gjfckgfjghw3u847u89t4rt7"
```

**Exploit Scenarios:**

1. **Silent environment divergence:** Both development and production configurations include the trailing `"`, so tokens work consistently—for now. The risk emerges when a developer or automated tool "cleans up" the value in one environment (removing the `"`) but not the other. At that point, tokens signed by one environment are silently rejected by the other, causing authentication failures that are difficult to diagnose because the root cause (a single `"` character) is invisible in most configuration viewers.

2. **Configuration pipeline corruption:** In containerized deployments, `.env` files are often processed by shell scripts or injected via Kubernetes secrets. The unescaped `"` character can cause parsing truncation in YAML (`value: "..."`), shell variable substitution, or Docker build arguments. This can result in the application reading an empty or truncated secret, signing tokens with a predictable or empty key.

**Impact:** Intermittent authentication failures between environments, or worst case,  tokens signed with an empty/truncated secret that can be brute-forced by an attacker who observes a single token.

**Recommended Fix:**
Remove the trailing quotation marks and regenerate secrets using a cryptographically secure method:

```bash
# Generate cryptographically secure random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Major Issues

### #4 — Absence of Rate Limiting on Authentication Endpoints

**Location:** All auth-related controllers (`auth.controller.ts`, `otp.controller.ts`)

**Observation:**
Login, registration, token refresh, and OTP endpoints have no request rate limiting. The nginx reverse proxy (`nginx/proxy.conf`) includes a 10 req/s limit, but this only applies to traffic routed through nginx. Direct API access bypasses this entirely.

**Exploit Scenario:**
An attacker can execute a brute-force attack against the login endpoint, attempting thousands of password combinations per second. For OTP endpoints, the attacker can flood a specific phone number with OTP requests, incurring SMS costs and potentially locking the legitimate user out of the OTP system. The current implementation has no per-IP or per-phone-number throttling.

**Recommended Fix:**
```bash
npm install @nestjs/throttler
```

Configure a global rate limiter with per-endpoint overrides:
- Global: 100 requests per 60 seconds per IP
- Auth endpoints: 10 requests per 60 seconds per IP
- OTP request: 3 requests per phone number per 60 seconds
- OTP verify: 5 requests per phone number per 60 seconds

---

### #5 — Permissions Guard Executes Database Query on Every Request

**Location:** `permissions.guard.ts`

**Observation:**
Each protected request triggers a nested Prisma query with three levels of JOINs:

```ts
private async getUserPermissions(userId: number): Promise<string[]> {
  const userRoles = await this.prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });
  // then iterates nested arrays to extract permission strings
}
```

**Exploit Scenario:**
Under normal load (e.g., 500 concurrent users making 2 requests/second), the database receives 1,000 permission queries per second. Each query traverses 3 tables (`user_role` → `role_permission` → `permission`). As user base grows to 10,000+, this query pattern becomes a database bottleneck. A simple DDoS attack against any authenticated endpoint amplifies into a database denial-of-service.

**Recommended Fix:**
Include permission identifiers directly in the JWT payload during authentication/authorization. The guard then extracts permissions from the decoded token without any database access:

```ts
// During token creation
const permissions = await this.getUserPermissions(user.id);
const payload = { sub: user.id, email: user.email, permissions };
return this.jwtService.sign(payload);

// In guard (no DB call)
const hasPermission = request.user.permissions.includes(requiredPermission);
```

**Trade-off:** Permissions are cached until the JWT expires. If an admin modifies a user's permissions, the change only takes effect after the user's token is refreshed. This is acceptable for most applications (tokens typically expire in 15-60 minutes). For immediate revocation, a short token expiry or a deny-list can be implemented.

---

### #6 — OAuth Tokens Stored Without Encryption

**Location:** `auth.service.ts`

**Observation:**
When linking Google or Kakao accounts, the provider's access token and refresh token are stored as plaintext:

```ts
await this.prisma.linkedAccount.create({
  data: {
    accessToken: googleProfile.accessToken,
    refreshToken: googleProfile.refreshToken,
  },
});
```

**Exploit Scenario:**
In the event of a database breach (SQL injection, compromised backup, insider threat), the attacker gains access to Google and Kakao API tokens. These tokens can be used to:
- Read the user's Gmail messages
- Access Google Drive files
- View KakaoTalk messages and contacts
- Perform API actions on behalf of the user

OAuth refresh tokens are long-lived and can be used to generate new access tokens without user interaction, extending the window of compromise indefinitely.

**Recommended Fix:**
Encrypt tokens using AES-256-GCM before persisting:

```ts
import { createCipheriv, randomBytes } from 'crypto';

function encrypt(text: string, key: Buffer): { iv: string; encrypted: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return {
    iv: iv.toString('hex'),
    encrypted: encrypted.toString('hex'),
  };
}
```

The encryption key should be stored as an environment variable (`OAUTH_TOKEN_ENCRYPTION_KEY`), never in the codebase or database.

---

### #7 — Frontend Route Guards Disabled for Development Routes

**Location:** `front-management/src/app/app.routes.ts`

**Observation:**
Multiple route definitions have their permission guards commented out during development:

```ts
{
  path: 'users',
  loadComponent: () => ...,
  // canActivate: [withPermissions('user:read')],
  children: [
    {
      path: 'list',
      loadComponent: loadUnderDevelopment,
      // canActivate: [withPermissions('user:read')],
    },
  ],
},
```

**Exploit Scenario:**
When a developer replaces `loadUnderDevelopment` with the actual component implementation, the route becomes fully accessible without authorization checks. A non-admin user who navigates directly to `/users/list` can see the user management interface. If the corresponding backend endpoints are also missing authorization (defense-in-depth failure), the user can perform administrative actions.

**Recommended Fix:**
Implement proper guard functions as placeholders even during development. Create a `withPermissions()` guard that always returns true during development but enforces permissions in production:

```ts
export function withPermissions(...perms: string[]) {
  if (environment.production) {
    return [AuthGuard, PermissionGuard(perms)];
  }
  return []; // Skip guards in development
}
```

---

### #8 — Weak Random Number Generator for Temporary Passwords

**Location:** `string.util.ts`

**Observation:**
The `generateTempPassword()` function uses `Math.random()`, which is not cryptographically secure:

```ts
export function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
```

**Exploit Scenario:**
`Math.random()` in V8 (Node.js) uses the xorshift128+ algorithm, which is predictable if an attacker can observe a sequence of generated values. If the temporary password generation is used for initial admin accounts or password reset flows, an attacker who can obtain one generated password can reverse-engineer the PRNG state and predict future passwords.

**Recommended Fix:**
```ts
import { randomBytes } from 'crypto';

export function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}
```

---

### #9 — Refresh Token Rotation Race Condition

**Location:** `auth.service.ts`

**Observation:**
During token refresh, new tokens are generated before the old refresh token hash is updated:

```ts
const tokens = await this.getTokens(user.id, user.email, roles);
await this.updateRefreshToken(user.id, tokens.refresh_token);
// Race window: old token remains valid between these two operations
```

**Exploit Scenario:**
An attacker who obtains a user's refresh token can continue using it alongside the legitimate user. When both parties attempt to refresh simultaneously:
1. Legitimate user refreshes → gets new token pair, old hash is updated
2. Attacker attempts refresh with old token → refresh fails (hash mismatch)
3. However, if the attacker refreshes _before_ the legitimate user, both sets of tokens remain valid

This is a known vulnerability pattern (similar to CWE-367: Time-of-check Time-of-use). Proper implementations should detect concurrent token usage as a token theft indicator.

**Recommended Fix:**
Implement token theft detection:

```ts
async refreshToken(userId: number, refreshToken: string) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  
  if (!user || !user.hashedRefreshToken) {
    throw new UnauthorizedException();
  }
  
  const isTokenValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
  
  if (!isTokenValid) {
    // Token reuse detected — potential theft. Invalidate all tokens.
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
    throw new UnauthorizedException('Token reuse detected');
  }
  
  // Invalidate old token BEFORE issuing new one
  await this.prisma.user.update({
    where: { id: userId },
    data: { hashedRefreshToken: null },
  });
  
  const tokens = await this.getTokens(user.id, user.email);
  await this.updateRefreshToken(user.id, tokens.refresh_token);
  
  return tokens;
}
```

---

## Minor Issues

### #10 — OTP Codes Written to Application Logs

**Location:** `otp.service.ts`

**Observation:**
OTP verification codes are unconditionally logged to the console:

```ts
console.log(`[OTP-DEBUG] OTP for ${dto.phone}: ${code}`);
```

**Risk:** In production, logs are aggregated to centralized platforms (CloudWatch, DataDog, ELK). Individuals with log access (SRE, support engineers) can view OTP codes, enabling unauthorized account access. This is particularly concerning for compliance with regulations like GDPR or Vietnam's Decree 13 on data protection.

**Recommended Fix:**
Guard the log statement with an environment check:

```ts
if (process.env.NODE_ENV === 'development') {
  console.log(`[OTP-DEBUG] OTP for ${dto.phone}: ${code}`);
}
```

---

### #11 — Excessive Use of Type Assertions (`as any`)

**Location:** Multiple files across the entire codebase

**Observation:**
Type assertions to `any` are used extensively, particularly in module configurations and Prisma operations:

```ts
expiresIn: configService.get<string>('JWT_EXPIRATION') as any,
description: p.description as any,
```

**Risk:** The `as any` pattern defeats TypeScript's compile-time type checking. If configuration schemas or Prisma types change during refactoring, the compiler will not flag incompatible assignments. This introduces runtime errors that manifest only in production.

**Recommended Fix:**
Define explicit type interfaces for configuration objects and Prisma input types rather than bypassing the type system. This is an incremental refactoring effort best addressed as part of regular development.

---

### #12 — Inconsistent SameSite Cookie Configuration

**Location:** `auth.controller.ts`

**Observation:**
Different SameSite policies are applied depending on the authentication flow:
- Login/register endpoints: `sameSite: 'strict'`
- OAuth callback endpoints: `sameSite: 'lax'`

**Risk:** While the inconsistency itself is not a direct vulnerability, it indicates a lack of standardized cookie security policy. Using `'lax'` everywhere (the modern default) with CSRF tokens is a more maintainable approach. Alternatively, documenting the rationale per-endpoint ensures future developers understand the security posture.

**Recommended Fix:**
Standardize on `sameSite: 'lax'` across all endpoints and implement CSRF protection for state-changing operations.

---

## Cross-Layer Issue Analysis

The following issues span multiple architectural layers and require coordinated fixes:

| Issue | Layers Affected | Coordination Required |
|-------|----------------|----------------------|
| #1 — OAuth token in URL | Backend + Frontend + Network | Backend must use cookies; frontend must send credentials on all requests |
| #5 — Permissions per-request | Backend + Authentication | Guard + JWT service must agree on token payload structure |
| #6 — OAuth tokens plaintext | Backend + Infrastructure | Requires encryption key management (KMS/Env vars) and secure key rotation |
| #7 — Missing frontend guards | Frontend + Backend | Defense-in-depth: if frontend guard is re-enabled, backend must also enforce |
| #9 — Race condition | Backend + Database | Fix requires atomic database update + token generation sequence |

---

## Remediation Plan (1-Week Sprint: Core Fixes)

### Days 1-2: Critical Security
| Day | Tasks | Estimated Effort |
|-----|-------|-----------------|
| Day 1 | #1: OAuth tokens → httpOnly cookies | 4h |
| Day 1 | #3: Fix JWT secret format | 15min |
| Day 2 | #2: Remove auto-migration from startup | 2h |
| Day 2 | #6: Encrypt OAuth tokens in database | 3h |

### Days 3-4: Major Issues
| Day | Tasks | Estimated Effort |
|-----|-------|-----------------|
| Day 3 | #4: Implement rate limiting | 4h |
| Day 3 | #8: Replace Math.random with crypto | 30min |
| Day 4 | #5: Cache permissions in JWT payload | 6h |
| Day 4 | #7: Re-enable frontend guards | 2h |

### Day 5: Remaining Fixes & QA
| Day | Tasks | Estimated Effort |
|-----|-------|-----------------|
| Day 5 | #9: Fix refresh token rotation | 4h |
| Day 5 | #10: Guard OTP logging | 15min |
| Day 5 | #12: Standardize SameSite policy | 1h |
| Day 5 | #11: Begin `as any` cleanup | Ongoing through next sprint |

> **Note:** Items beyond the 5-day sprint (#11 cleanup, full CI/CD implementation) should be moved to the following sprint backlog.

---

## Preventive CI/CD Measures

To prevent recurrence of these issues, the following automated checks should be added to the CI pipeline:

1. **Security lint rule:** Ban sensitive data patterns (`access_token`, `token`) in URL parameter assignments using ESLint with `@typescript-eslint/no-unsafe-argument`
2. **Architecture lint rule:** Flag `execSync` usage outside of designated scripts
3. **Environment validation:** Automated `.env` file parser that validates required keys and identifies malformed values
4. **Dependency scanning:** Integrate `npm audit` or Snyk into the CI pipeline to detect known vulnerabilities
5. **Permission audit:** Automated check to ensure all frontend routes have at least one guard assigned
6. **Rate limiting baseline:** Default throttle configuration (100 req/min per IP) enforced at the framework level, with endpoints explicitly opting into higher limits
