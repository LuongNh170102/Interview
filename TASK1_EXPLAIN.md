# TASK 1 — Code Review & Critical Issue Analysis

**Reviewer Role:** Senior Security & Full-Stack Engineer / Tech Lead  
**Repository:** `https://github.com/LuongNh170102/Interview`  
**Stack:** NestJS · Prisma · PostgreSQL · Angular (Nx Monorepo)  
**Review Date:** 2026-04-09

---

## 1. What You Have Done (The 'How')

I performed a full static code review of the repository, systematically scanning:

- **Backend entry & bootstrap** (`api-service/src/main.ts`, `app.module.ts`)
- **Authentication & token management** (`auth/auth.controller.ts`, `auth/auth.service.ts`, `auth/jwt.strategy.ts`)
- **Authorization layer** (`common/guards/`, `product/guards/`, `common/pipes/`)
- **Business service logic** (`agency/`, `merchant/`, `product/`, `otp/`)
- **Database schema & seed** (`prisma/schema.prisma`, `prisma/seed.ts`)
- **Environment configuration** (`.env`, `.env.development`)

The focus was on production-risk issues spanning security, authorization, business logic integrity, and data exposure.

---

### Issue 1 — OTP Code Logged to Console in Plain Text (Information Disclosure)

**Title:** OTP Secret Leaked via `console.log` in Production Logs

**Severity:** 🔴 Critical

**File Path:** `api-service/src/app/otp/otp.service.ts`

**Line Number:** Line 20

```typescript
// Line 20 — Actual code in repository:
console.log(`[OTP-DEBUG] OTP for ${dto.phone}: ${code}`);
```

**Real-world Impact:**

In any real deployment, application logs are aggregated into centralized logging infrastructure (e.g., AWS CloudWatch, Datadog, ELK Stack). Anyone with log access — including DevOps engineers, support staff, or an attacker who gains read access to log streams — can trivially retrieve any user's OTP code at the moment it was sent.

This completely defeats the purpose of OTP-based identity verification. An attacker who can read server logs (via a misconfigured S3 bucket holding log exports, a compromised CI/CD pipeline, or insider threat) can:
1. Target any phone number.
2. Trigger `/agencies/otp/request` or `/merchants/otp/request`.
3. Read the OTP from logs.
4. Call `/otp/verify` with the correct code.
5. Obtain a valid `verificationToken` (signed JWT) and register a new Agency or Merchant **bypassing the intended SMS verification entirely**.

**Concrete Fix:**

Remove the `console.log` entirely. Integrate a real SMS provider (e.g., Twilio, AWS SNS). In the interim, if debug logging is needed, use a structured logger that is disabled in production via log-level configuration:

```typescript
// BEFORE (insecure):
console.log(`[OTP-DEBUG] OTP for ${dto.phone}: ${code}`);

// AFTER (secure — remove the line and send via SMS):
// await this.smsService.send(dto.phone, `Your verification code is: ${code}`);

// If temporary debug logging is absolutely required during dev only:
import { Logger } from '@nestjs/common';
private readonly logger = new Logger(OtpService.name);

// Use only in development and never log the actual code:
this.logger.debug(`OTP requested for phone ending in ...${dto.phone.slice(-4)}`);
```

Additionally, add an environment check to NestJS's logger so debug logs are suppressed at `LOG_LEVEL=warn` or higher in production.

**Bonus — Exploit Scenario (Multi-Layer):**

```
Attacker → POST /api/agencies/otp/request { phone: "+84900000000" }
         → Server generates OTP, logs it in CloudWatch/stdout
         → Attacker reads log (e.g., via exposed Kibana dashboard, S3 log bucket)
         → POST /api/agencies/otp/verify { phone: "...", code: "123456" }
         → Server returns { verificationToken: "eyJ..." }
         → POST /api/agencies/register { ..., verificationToken: "eyJ..." }
         → Fraudulent Agency account created, bypassing SMS flow entirely
```

This issue spans: **OTP Service → All OTP-dependent registration flows (Agency, Merchant)**.

---

### Issue 2 — Access Token Exposed as URL Query Parameter (Token Leakage via Redirect)

**Title:** Access Token Sent in Redirect URL After Google/Kakao OAuth Callback

**Severity:** 🔴 Critical

**File Path:** `api-service/src/app/auth/auth.controller.ts`

**Line Numbers:** Lines 201–207 (Google OAuth) and Lines 339–345 (Kakao OAuth)

```typescript
// Lines 201–207 — Google OAuth callback:
const params = new URLSearchParams({
  success: 'true',
  access_token: successResult.access_token,   // ← JWT sent in URL
  user: JSON.stringify(successResult.user),
  permissions: JSON.stringify(successResult.permissions),
});
return res.redirect(`${frontendUrl}/login?${params.toString()}`);

// Lines 339–345 — Kakao OAuth callback (identical pattern):
const params = new URLSearchParams({
  success: 'true',
  access_token: successResult.access_token,   // ← JWT sent in URL
  user: JSON.stringify(successResult.user),
  permissions: JSON.stringify(successResult.permissions),
});
return res.redirect(`${frontendUrl}/login?${params.toString()}`);
```

**Real-world Impact:**

JWTs placed in the URL query string are **permanently stored** in multiple locations outside the application's control:

1. **Browser history** — Any user who shares their computer exposes logged-in state.
2. **Server access logs** — Every intermediate proxy, CDN (Cloudflare, Nginx), and load balancer logs the full URL. The JWT is stored in plain text in infrastructure logs.
3. **Referrer header** — If the frontend page at `/login?access_token=...` loads any third-party resource (analytics script, font, ad), the browser sends the full URL including the JWT as the `Referer` header to those third parties.
4. **Browser extensions** — Extensions that log URLs (ad blockers, password managers, monitoring tools) capture the token.

An attacker who obtains this token — from any of the above — can impersonate the authenticated user for the full token lifetime (configured as `15d` in `.env.development`, which is an extremely long window).

**Concrete Fix:**

Use the **OAuth PKCE + short-lived code exchange** pattern. Post-authentication, the backend should store the tokens server-side and return a short-lived, single-use `state` code in the redirect. The frontend then exchanges this code for the tokens via a secure, POST-only endpoint:

```typescript
// AFTER — store tokens server-side, redirect with a short-lived state code only:
const stateCode = await this.authService.createOAuthStateCode(successResult);

return res.redirect(`${frontendUrl}/login?state=${stateCode}`);

// Frontend calls: POST /api/auth/exchange-state { state: "..." }
// Backend returns tokens (over HTTPS) and sets HttpOnly cookie
```

Alternatively, as a minimum viable fix, set the refresh token as an `HttpOnly` cookie (already done) and return **only** the access token via the cookie too — never in the URL:

```typescript
// Set both tokens as HttpOnly cookies, no URL params:
res.cookie('access_token', successResult.access_token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes
});
return res.redirect(`${frontendUrl}/login?success=true`);
```

**Bonus — Exploit Scenario (Multi-Layer):**

```
User logs in via Google →
Backend redirects to: https://front-management.vhan.com/login?access_token=eyJhbGc...
→ Nginx logs the full URL (with JWT) to /var/log/nginx/access.log
→ Angular's Google Analytics script fires with document.referrer containing the JWT
→ Attacker monitors Nginx logs or intercepts Referrer header
→ Uses JWT to call GET /api/auth/profile, GET /api/agencies, PATCH /api/merchants/:id/status
→ Full admin impersonation for 15 days (JWT_EXPIRATION="15d")
```

This issue spans: **OAuth callback (backend) → Browser history/logs → Third-party referrer leak (frontend) → All protected API endpoints**.

---

### Issue 3 — `GET /api/products` Exposes All Products With No Authentication or Pagination

**Title:** Unauthenticated, Unbounded `findAll()` on Products Endpoint — Data Exposure + DoS Vector

**Severity:** 🟠 Major

**File Path:** `api-service/src/app/product/product.controller.ts` and `api-service/src/app/product/product.service.ts`

**Line Numbers:** Controller line 46–48; Service lines 73–78

```typescript
// product.controller.ts — Lines 46–48:
@Get()
findAll() {           // ← No @UseGuards, no authentication required
  return this.productService.findAll();
}

// product.service.ts — Lines 73–78:
async findAll() {
  return this.prisma.product.findMany({   // ← No WHERE, no TAKE, no SKIP
    include: {
      merchant: true,   // ← Joins full merchant record for every product
    },
  });
}
```

**Real-world Impact:**

In a production system with thousands of products:

1. **Any anonymous user (or bot)** can call `GET /api/products` and receive the entire products table in a single response, including all associated `merchant` data (addresses, phone numbers, business details). This is an unintended data exposure — B2C users should only see products from specific merchants they browse.

2. **DoS (Denial of Service):** A single attacker (or crawler) repeatedly calling this endpoint can trigger full table scans with multi-table joins, consuming unbounded database memory and CPU. With no rate limiting, this can bring down the PostgreSQL instance.

3. **Business Intelligence Leak:** Competitor scraping tools can enumerate the entire product catalog, pricing, and Merchant metadata without any credentials.

**Concrete Fix:**

Apply authentication and mandatory pagination. If this endpoint is intended for B2C public browsing, scope it to specific merchant and add cursor-based or offset pagination:

```typescript
// product.controller.ts — fixed:
@Get()
findAll(@Query() paginationDto: PaginationDto) {
  return this.productService.findAll(paginationDto);
}

// product.service.ts — fixed:
async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<any>> {
  const { page = 1, limit = 20 } = paginationDto;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.prisma.product.findMany({
      where: { isActive: true },   // Only return active products
      skip,
      take: Math.min(limit, 100),  // Cap maximum page size
      orderBy: { createdAt: 'desc' },
      select: {                    // Select only public fields, not full merchant
        externalId: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        averageRating: true,
        metadata: true,
        merchant: {
          select: { name: true, externalId: true, city: true },
        },
      },
    }),
    this.prisma.product.count({ where: { isActive: true } }),
  ]);

  return { data, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
}
```

**Bonus — Multi-Layer Impact:**

This is a cross-layer issue:
- **API layer:** No auth guard, no pagination.
- **Database layer:** Full table scan + N-relation join on every call.
- **Business layer:** Leaks product prices and merchant metadata to unauthenticated crawlers.

---

### Issue 4 — `PermissionsGuard` Makes N+1 Database Queries Per Request

**Title:** N+1 Query Problem in `PermissionsGuard` — Fetches Permissions Fresh from DB on Every Protected API Call

**Severity:** 🟠 Major

**File Path:** `api-service/src/app/common/guards/permissions.guard.ts`

**Line Numbers:** Lines 44–70

```typescript
// permissions.guard.ts — Lines 44–58:
private async getUserPermissions(userId: number): Promise<string[]> {
  const userRoles = await this.prisma.userRole.findMany({  // ← DB Query on EVERY request
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,   // ← 3-level deep JOIN on every API call
            },
          },
        },
      },
    },
  });
  // ...
}
```

**Real-world Impact:**

Every single API call that is guarded by `@UseGuards(JwtAuthGuard, PermissionsGuard)` generates a deeply nested 3-level JOIN query:

```
userRole → role → rolePermission → permission
```

Under concurrent load (e.g., 100 admin users simultaneously managing merchants), this generates 100+ heavy JOIN queries per second against the `user_roles`, `roles`, `role_permissions`, and `permissions` tables. This will:

1. **Dramatically increase P99 API latency** as database connection pool saturation increases.
2. **Make the database the bottleneck** even though permissions rarely change — they only change when an admin reconfigures roles.
3. **Cause cascading failures:** Slow DB responses cause NestJS worker threads to queue, leading to request timeouts across the entire application.

Note: the JWT payload already contains the user's `roles` array (set at `auth.service.ts` line 80–81). The guard has the information it needs but ignores it, choosing to re-fetch from the database instead.

**Concrete Fix:**

Cache permission lookups using the `roles` array already present in the JWT payload. Implement an in-memory cache (or Redis for distributed deployments):

```typescript
// Option A — Use roles from JWT + in-memory cache (simple, effective):
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    // Cache key per user, TTL = 5 minutes
    const cacheKey = `permissions:${user.userId}`;
    let userPermissions = await this.cacheManager.get<string[]>(cacheKey);

    if (!userPermissions) {
      userPermissions = await this.getUserPermissions(user.userId);
      await this.cacheManager.set(cacheKey, userPermissions, 300); // 5 min TTL
    }

    const hasPermission = requiredPermissions.every((p) =>
      userPermissions.includes(p),
    );
    if (!hasPermission) throw new ForbiddenException(AUTH_MESSAGES.ACCESS_DENIED);
    return true;
  }
  // ... getUserPermissions remains the same as fallback
}
```

Cache invalidation: clear `permissions:{userId}` when a user's roles are modified by an admin.

**Bonus — Multi-Layer Impact:**

- **Backend:** DB connection pool exhaustion under load.
- **API:** All guarded endpoints become slow simultaneously, causing cascading timeouts.
- **Frontend:** Admin dashboard becomes unresponsive under concurrent usage — appears as an application-level failure rather than a DB issue, making it harder to diagnose.

---

### Issue 5 — Hardcoded Default Admin Credentials in `seed.ts`

**Title:** Hardcoded Weak Admin Password (`admin123`) Used as Fallback in Seed File

**Severity:** 🟠 Major

**File Path:** `prisma/seed.ts`

**Line Numbers:** Lines 380–382

```typescript
// prisma/seed.ts — Lines 380–382:
const adminEmail = process.env.ADMIN_EMAIL || 'admin@vhandelivery.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';    // ← Hardcoded fallback
const passwordHash = await bcrypt.hash(adminPassword, 10);
```

**Real-world Impact:**

The seed script is designed to be re-runnable (it uses `upsert`). If a developer or a CI/CD pipeline runs `prisma db seed` in a production environment without explicitly setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables, the `PLATFORM_ADMIN` account is created (or left as-is if already created) with email `admin@vhandelivery.com` and password `admin123`.

The `PLATFORM_ADMIN` role has **all permissions** assigned (`allPermissions` — `seed.ts` line 327). An attacker systematically attempting this well-known default credential pair against the login endpoint would immediately gain full administrative control of the platform:

- Approve/reject any Agency or Merchant registration (`PATCH /api/merchants/:id/status`).
- Create admin-level Merchants (`POST /api/merchants/admin-create`).
- Read all user data, any agency or merchant details.
- Escalate roles of other users.

This is especially dangerous because:
1. The email is also hardcoded — making it **predictable**.
2. CI/CD pipelines in staging/production environments sometimes re-run seeds on deployment to apply migrations, inadvertently ensuring this account always exists.

**Concrete Fix:**

Remove the hardcoded fallback entirely. Make the seed fail fast and loudly if credentials are not provided via environment variables:

```typescript
// prisma/seed.ts — fixed:
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  throw new Error(
    'ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set before seeding. ' +
    'Never use default credentials in production.',
  );
}

// Enforce minimum password strength:
if (adminPassword.length < 16) {
  throw new Error('ADMIN_PASSWORD must be at least 16 characters long.');
}

const passwordHash = await bcrypt.hash(adminPassword, 12); // Increase cost factor too
```

Additionally, add a guard in the `main()` function to refuse to run the seed if `NODE_ENV === 'production'` unless explicitly overridden with a `FORCE_SEED=true` flag.

**Bonus — Exploit Scenario:**

```
Attacker discovers the open-source repository (public GitHub).
→ Reads prisma/seed.ts, finds email + password.
→ Attempts POST /api/auth/login { email: "admin@vhandelivery.com", password: "admin123" }
→ If CI/CD ran seeds without env vars: instant PLATFORM_ADMIN access.
→ Creates rogue Merchant accounts, approves them, extracts all business data, or
   triggers mass data deletion.
```

This issue also spans to the `.env.development` file (line 11), which contains `DATABASE_URL` with credentials `admin:admin` committed to the repository, compounding the blast radius.

---

## 2. Technical Justification (The 'Why')

### Top 3 Most Critical Issues

#### Rank #1 — Issue 2: Access Token Exposed in OAuth Redirect URL

This is the most severe issue because:

1. **Irreversible once leaked.** Unlike a password that can be changed, a JWT token cannot be "unissued." Once captured in a server log or referrer header, it remains valid for `JWT_EXPIRATION = 15d`. That is a 15-day window for full account takeover on any admin-level account.

2. **Passive exploitation — no user interaction required.** The attacker does not need to phish the user or run active attacks. Simply monitoring Nginx access logs (a routine DevOps activity) or reading log exports from S3 is sufficient.

3. **Admin accounts are the primary target.** The `front-management` portal (where Google/Kakao OAuth is likely used by internal staff) grants `PLATFORM_ADMIN` access. A compromised admin token = full system compromise (approve merchants, access all business data, mutate system-wide roles).

**Systemic risk:** This pattern appears in **both** the Google OAuth callback (line 207) and the Kakao OAuth callback (line 345), doubling the attack surface.

#### Rank #2 — Issue 1: OTP Code Logged to Console

This directly undermines the core security mechanism that gates Agency and Merchant registration. The OTP exists to verify phone ownership — if that verification is bypassed:

1. **Anyone can register as a Merchant without owning the business phone number.** Fraudulent merchants can inject themselves into the platform, accept orders, and never fulfill deliveries.

2. **The vulnerability is silent and persistent.** Every OTP request creates a log entry. Historical log archives contain every OTP ever generated. If logs are ever exfiltrated (data breach of the logging infrastructure), every past registration can be audited by the attacker to understand which accounts were registered.

3. **Zero technical skill required to exploit.** Reading a log file requires no hacking knowledge. This makes the attack surface entirely accessible to non-technical insider threats.

#### Rank #3 — Issue 5: Hardcoded Admin Credentials in Seed

The combination of a predictable email (`admin@vhandelivery.com`) and a dictionary password (`admin123`) for an account with all permissions is a textbook configuration vulnerability. It fails OWASP A05:2021 — Security Misconfiguration and A07:2021 — Identification and Authentication Failures simultaneously.

The re-runnable `upsert` nature of `prisma db seed` means this account can be **re-created silently** on any migration deployment run. It is not a one-time risk — it is a persistent risk that re-activates with each seed execution.

---

### Security & Stability: CI/CD Checks to Prevent Recurrence

#### GitHub Actions Automated Checks

Add the following steps to `.github/workflows/ci.yml`:

```yaml
# 1. Secret scanning — catch hardcoded credentials before they merge
- name: Scan for secrets
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

# 2. Dependency vulnerability audit
- name: NPM Security Audit
  run: npm audit --audit-level=high --workspaces

# 3. Static analysis with ESLint security plugin
- name: ESLint with security rules
  run: npx eslint . --rule 'no-console: ["error", { allow: ["warn", "error"] }]'
```

#### ESLint Rules to Enforce

Add to `eslint.config.mjs`:

```javascript
import security from 'eslint-plugin-security';

export default [
  security.configs.recommended,
  {
    rules: {
      // Catch console.log leaking sensitive data
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Prevent unvalidated dynamic object injection
      'security/detect-object-injection': 'warn',
      // Catch unsafe regex
      'security/detect-unsafe-regex': 'error',
    },
  },
];
```

#### SonarQube Quality Gates

Configure a SonarQube gate that:
- Blocks merge if `Security Rating` drops below **A**.
- Blocks merge if any `Blocker` or `Critical` severity issue is detected in new code.
- Sets `OWASP Top 10` as a mandatory security standard scan.

---

### 1-Week Sprint Plan

| Day | Task | Priority | Assignee |
|-----|------|----------|----------|
| **Day 1** | `[SEC-001]` Remove `console.log` from `otp.service.ts`; replace with structured logger; add SMS service interface | P0 | Backend Lead |
| **Day 1** | `[SEC-002]` Refactor OAuth callbacks to NOT send tokens in URL; implement short-lived state-code exchange or HttpOnly cookie for access token | P0 | Backend Lead |
| **Day 2** | `[SEC-003]` Remove hardcoded fallback credentials from `seed.ts`; add `ADMIN_EMAIL`/`ADMIN_PASSWORD` env validation; update CI pipeline env vars | P0 | DevOps |
| **Day 2** | `[PERF-001]` Add `@nestjs/cache-manager` + Redis integration; cache `PermissionsGuard` lookups with 5-minute TTL; add cache invalidation on role changes | P1 | Backend |
| **Day 3** | `[API-001]` Add auth guard and mandatory `PaginationDto` to `GET /api/products`; restrict `findAll` to active products with field selection | P1 | Backend |
| **Day 3** | `[CI-001]` Add `gitleaks-action` to GitHub Actions workflow; configure ESLint `no-console` as error; add `npm audit` step | P1 | DevOps |
| **Day 4** | `[TEST-001]` Write unit tests for `OtpService` (assert no log output), `PermissionsGuard` cache hit/miss, and `ProductController` auth enforcement | P2 | QA/Backend |
| **Day 4** | `[SEC-004]` Audit `.env.development` committed credentials (DB password `admin:admin`, MinIO `admin:admin123`); rotate and add `.env.development` to `.gitignore` warning docs | P2 | DevOps |
| **Day 5** | `[REVIEW]` Full regression test on auth flows (email/password, Google OAuth, Kakao OAuth); verify tokens no longer appear in URLs; staging smoke test | P1 | All |
| **Day 5** | `[DOC-001]` Update `README.md` with required env vars; document seed requirements; add security runbook | P2 | Tech Lead |

**Definition of Done:** All P0 items merged to `main`, all automated CI checks passing green, staging environment verified, no open Critical/Blocker in SonarQube gate.
