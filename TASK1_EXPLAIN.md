# TASK 1 EXPLAIN - CODE REVIEW & CRITICAL ISSUE ANALYSIS

# Part 1: Detailed Code Issues

# Issue 1: Missing Merchant Ownership Check on Status Change
* File Path: api-service/src/app/merchant/merchant.controller.ts
* Line Number: 43
* Severity: Critical
* Justification: An authenticated user can update the operational or approval status of any merchant store by supplying its external UUID in the route parameters. The controller lacks validation checking whether the requesting user owns the merchant resource or has high-privilege administrative roles.
* Exploit Scenario: A malicious merchant registers an account, logs in, intercepts the update status HTTP request, replaces the UUID parameter with a competitor's merchant UUID, and changes their competitor's operationalStatus to INACTIVE, suspending their online store.
* Actionable Fix: Introduce a guard or decorator validation checking if the user owns the target resource or holds appropriate system-level roles before updating status.

# Issue 2: Hardcoded JWT Secret Key in Version Control
* File Path: api-service/src/app/auth/auth.module.ts
* Line Number: 22
* Severity: Critical
* Justification: The JWT signing secret is hardcoded to a fallback string literal in the application source code instead of loading strictly from securely managed environment variables.
* Exploit Scenario: If the repository is leaked or accessed by unauthorized staff, an attacker reads the hardcoded secret, crafts fake JWT tokens with high privileges (such as admin), and accesses administrative API endpoints.
* Actionable Fix: Load the JWT secret using ConfigService with environment variable configuration, rejecting start if the secret is empty or set to the fallback.

# Issue 3: Insecure Temporary Password Generation for Direct Merchant Creation
* File Path: api-service/src/app/merchant/merchant.service.ts
* Line Number: 353
* Severity: Major
* Justification: When administrators create a merchant directly, a temporary password is generated using Math.random(), which is not cryptographically secure. The seed can be easily predicted, allowing brute force access to new merchant owner accounts.
* Exploit Scenario: An attacker monitors newly created merchant profiles and predicts the random generation seed value, successfully logging into the owner's dashboard.
* Actionable Fix: Replace Math.random() with Node.js crypto module's randomBytes or generate random UUID string values for secure temporary passwords.

# Issue 4: Missing Request Payload Validation for OTP Verification
* File Path: api-service/src/app/otp/otp.service.ts
* Line Number: 28
* Severity: Major
* Justification: The endpoint validating verification OTP codes lacks request schema sanitization or strict constraints on OTP code format, potentially opening up automated brute-force attacks or script injection.
* Exploit Scenario: A client continuously sends random six-digit OTP codes in loop requests without rate limiting to bypass registration authentication controls.
* Actionable Fix: Add class-validator validation rules on verification payloads and implement rate-limiting middleware (nestjs/throttler) specifically for verification endpoints.

# Issue 5: Missing Global Exception Handling for Database Operations
* File Path: api-service/src/app/prisma.service.ts
* Line Number: 10
* Severity: Minor
* Justification: Uncaught database errors during query execution spill internal table schema details and Prisma raw call traces back in standard HTTP error payloads, disclosing backend schema layouts.
* Exploit Scenario: An attacker enters invalid parameters causing prisma queries to crash. The API returns details about database schemas and table layouts.
* Actionable Fix: Bind a global exception filter catching prisma query errors and translating them to standardized, clean HTTP exceptions.


---

## Part 2: Top 3 Critical Issues Selection and Justification

### 1. Issue 1: Missing Merchant Ownership Check on Status Change
* Reason for Selection: This vulnerability allows horizontal privilege escalation across all merchants. Any logged-in user can maliciously shut down or manipulate the business operations of any competitor store. This represents an immediate threat to business continuity and trust in a multi-tenant platform.

### 2. Issue 2: Hardcoded JWT Secret Key in Version Control
* Reason for Selection: By exposing the secret key in the repository, any developer, repository scanner, or third-party tool with codebase access can immediately forge high-privilege tokens. An attacker can elevate their privileges to a system administrator, gaining full access to the database and backend administration APIs.

### 3. Issue 3: Insecure Temporary Password Generation for Direct Merchant Creation
* Reason for Selection: Math.random() is predictable and can be brute-forced or computed if the PRNG state is compromised. Since these accounts are created directly by administrators and sent credentials, an attacker could pre-compute or guess temporary passwords, intercepting owner accounts before the merchant registers or changes their password.

---

## Part 3: Sprint Plan & CI/CD Security Checks

### 1-Week Sprint Plan
* Day 1: Hotfix Issue 1 (Merchant ownership guard) and Issue 2 (JWT secret integration with dotenv config).
* Day 2: Implement cryptographically secure password generators (crypto module) and payload validation models.
* Day 3: Add rate-limiting capabilities using throttler guards on authorization and OTP validation endpoints.
* Day 4: Set up NestJS global exception filters for Prisma database errors to prevent schema leaks.
* Day 5: Write unit tests covering ownership validation rules and configuration load overrides.

### CI/CD Checks and Preventing Rules
* Setup SonarQube or Snyk scan scripts checking code vulnerabilities in github actions.
* Configure GitGuardian in repository workflows to prevent committing secrets or tokens.
* Enforce ESLint rules prohibiting Math.random() usages for cryptographically sensitive computations.
