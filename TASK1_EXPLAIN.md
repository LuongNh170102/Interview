\# TASK 1 – Code Review \& Critical Issue Analysis



\## 1. What I Have Done



Performed a full code review across the codebase focusing on:

\- Environment configuration and startup safety

\- Database schema design and consistency

\- Authentication strategies

\- Service layer patterns



\---



\## 2. Issues Found



\### Issue 1 – Missing env validation: GoogleStrategy crashes on startup

\- \*\*File:\*\* `api-service/src/app/auth/strategies/google.strategy.ts` – line 10

\- \*\*Severity:\*\* Major

\- \*\*Impact:\*\* If `GOOGLE\_CLIENT\_ID` is missing from `.env`, the entire server fails to start. All users are affected.

\- \*\*Fix:\*\* Add fallback `|| process.env.GOOGLE\_CLIENT\_ID || 'dummy'` or use Joi schema validation on startup.



\---



\### Issue 2 – Missing env validation: KakaoStrategy crashes on startup

\- \*\*File:\*\* `api-service/src/app/auth/strategies/kakao.strategy.ts` – line 13

\- \*\*Severity:\*\* Major

\- \*\*Impact:\*\* Same as Issue 1 — server crash on missing Kakao credentials. Duplicated anti-pattern across OAuth strategies.

\- \*\*Fix:\*\* Same approach as Issue 1. Root fix: validate all env vars at startup using `@nestjs/config` with Joi.



\---



\### Issue 3 – Auto-migration in production risk: PrismaService runs migrate on startup

\- \*\*File:\*\* `api-service/src/app/prisma.service.ts` – line 24

\- \*\*Severity:\*\* Critical

\- \*\*Impact:\*\* Running `prisma migrate deploy` inside the app on every startup is dangerous in production — a failed migration crashes the server and can corrupt database state. Migration should be a separate CI/CD step, not embedded in the app.

\- \*\*Fix:\*\* Remove `execSync('npx prisma migrate deploy')` from `onModuleInit`. Run migrations as a separate step in the deployment pipeline.



\---



\### Issue 4 – Courier model missing ApprovalStatus (schema inconsistency)

\- \*\*File:\*\* `prisma/schema.prisma` – Courier model

\- \*\*Severity:\*\* Critical

\- \*\*Impact:\*\* `Agency` and `Merchant` both have `approvalStatus`, `rejectionReason`, `approvedBy` fields. `Courier` has none of these — meaning there is no way to implement the PENDING → APPROVED → REJECTED flow required by the business logic. This directly breaks Task 2.

\- \*\*Fix:\*\* Add `approvalStatus ApprovalStatus @default(PENDING)`, `rejectionReason`, `approvedAt`, `approvedBy`, `rejectedAt`, `rejectedBy` fields to the `Courier` model — consistent with `Agency` and `Merchant`.



\---



\### Issue 5 – Courier model uses String instead of Enum for status fields

\- \*\*File:\*\* `prisma/schema.prisma` – Courier model

\- \*\*Severity:\*\* Major

\- \*\*Impact:\*\* `status` and `vehicleType` are plain `String?` with no enforcement. Any invalid value (`'ONLINE'`, `'available'`, `'xyz'`) can be saved to the database. Inconsistent with `Agency` and `Merchant` which use proper enums.

\- \*\*Fix:\*\* Create enums `CourierStatus` and `VehicleType` and apply them to the `Courier` model.



\---



\### Issue 6 – OtpVerification not linked to User

\- \*\*File:\*\* `prisma/schema.prisma` – OtpVerification model

\- \*\*Severity:\*\* Minor

\- \*\*Impact:\*\* OTP records are only linked by `phone` string — no `userId` foreign key. Cannot reliably trace which user an OTP belongs to, and opens the door to OTP reuse across different accounts with the same phone.

\- \*\*Fix:\*\* Add `userId Int? @map("user\_id")` and a relation to `User`.



\---



\## 3. Top 3 Most Critical Issues



| # | Issue | Why Critical |

|---|-------|-------------|

| 1 | Issue 3 – Auto-migration on startup | Can corrupt production database and crash server on every deploy |

| 2 | Issue 4 – Courier missing ApprovalStatus | Directly blocks core business flow (PENDING → APPROVED) |

| 3 | Issue 1 \& 2 – OAuth env not validated | Server cannot start at all if env vars are missing — affects all users |



\---



\## 4. Technical Justification



\### Why auto-migration is dangerous

Running `execSync('npx prisma migrate deploy')` synchronously inside `onModuleInit` blocks the event loop and ties database migration lifecycle to app startup. In production, migrations should run in a controlled CI/CD step with rollback capability — not embedded inside the application process.



\### Why enum consistency matters

Using raw strings instead of enums removes database-level constraints. PostgreSQL enums enforce valid values at the storage layer — strings do not. This is a schema design flaw that will cause bugs when filtering couriers by status.



\### Proposed CI/CD checks

\- Add lint rule: disallow `execSync` inside NestJS lifecycle hooks

\- Add env validation step in CI using `dotenv-safe` or Joi schema

\- Add Prisma schema lint check: flag String fields with inline comments listing allowed values (should be enums)

