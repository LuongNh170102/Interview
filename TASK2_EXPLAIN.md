# TASK 2 — Implement Courier Registration Flow

**Author:** Phạm Hữu Toàn  
**Branch:** `phamhuutoan`  
**Stack:** NestJS · Prisma · PostgreSQL · Angular (Nx Monorepo)  
**Completion Date:** 2026-04-09

---

## 1. What You Have Done (The 'How')

### Part A — Database Design

#### Schema Changes (`prisma/schema.prisma`)

The existing `Courier` model was a minimal stub (lacking an approval workflow, unique constraints, indexes, or soft delete). It was fully replaced with a production-grade model that mirrors the `Agency` and `Merchant` patterns already established in the codebase.

**Key fields added:**

| Field | Type | Purpose |
|---|---|---|
| `externalId` | `String @unique @db.Uuid` | Public identifier exposed in API responses; hides internal integer PK |
| `email` | `String @unique` | Unique business constraint matching courier's account email |
| `phone` | `String @unique` | Prevents duplicate courier enrollments per phone number |
| `approvalStatus` | `ApprovalStatus` (enum) | Reuses the shared `PENDING \| APPROVED \| REJECTED` Prisma enum |
| `approvedAt / approvedBy` | `DateTime? / Int?` | Audit trail: who approved and when |
| `rejectedAt / rejectedBy / rejectionReason` | `DateTime? / Int? / String?` | Audit trail + user-facing reason for rejection |
| `onlineStatus` | `String` | Operational flag (`ONLINE \| OFFLINE \| BUSY`) for order dispatch |
| `licenseNumber` | `String?` | Vehicle license required for registration verification |
| `deletedAt` | `DateTime?` | Soft-delete support — records are never hard-deleted |

**Indexes created:**

```prisma
@@index([approvalStatus])           -- fast admin queue queries (PENDING filter)
@@index([onlineStatus])             -- fast dispatch queries (ONLINE couriers)
@@index([approvalStatus, onlineStatus]) -- composite: find APPROVED+ONLINE couriers
@@index([deletedAt])                -- efficient soft-delete exclusion
@@index([createdAt])                -- default sort by registration date
```

**Unique constraints:**

```prisma
phone  String @unique   -- prevents duplicate phone registrations
email  String @unique   -- prevents duplicate account emails
```

#### Seed Changes (`prisma/seed.ts`)

Added 5 new permissions and mapped them to the correct roles:

| Permission | Assigned To |
|---|---|
| `courier:create` | `PLATFORM_ADMIN` (via `allPermissions`) |
| `courier:read` | `PLATFORM_ADMIN`, `COURIER` |
| `courier:approve` | `PLATFORM_ADMIN` only |
| `courier:reject` | `PLATFORM_ADMIN` only |
| `courier:delete` | `PLATFORM_ADMIN` only |

The `COURIER` role receives only `courier:read` and `order:read` — it cannot approve or reject other couriers.

---

### Part B — Backend API

#### Files Created

```
api-service/src/app/courier/
├── courier.module.ts              # NestJS module (mirrors AgencyModule)
├── courier.controller.ts          # HTTP endpoints
├── courier.service.ts             # Business logic
├── courier.service.spec.ts        # Unit tests (15 test cases)
├── dto/
│   ├── register-courier.dto.ts    # Registration payload with verificationToken
│   ├── reject-courier.dto.ts      # Rejection payload with mandatory reason
│   └── courier-query.dto.ts       # Query params with pagination + status filter
├── entities/
│   └── courier.entity.ts          # Response entity (hides userId, approvedBy, rejectedBy)
└── builders/
    └── courier-query.builder.ts   # Fluent query builder (mirrors AgencyQueryBuilder)

api-service/src/app/common/constants/
└── courier.constant.ts            # COURIER_REGISTRATION_OTP, COURIER_APPROVAL_STATUS enum
```

#### API Endpoints

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/api/couriers/otp/request` | ❌ None | — | Request OTP to phone |
| `POST` | `/api/couriers/otp/verify` | ❌ None | — | Verify OTP → get verificationToken |
| `POST` | `/api/couriers/register` | ✅ JWT | — | Register courier (PENDING status) |
| `GET` | `/api/couriers` | ✅ JWT | `courier:read` | List couriers (paginated, filterable) |
| `GET` | `/api/couriers/:id` | ✅ JWT | `courier:read` | Get single courier by externalId |
| `PATCH` | `/api/couriers/:id/approve` | ✅ JWT | `courier:approve` | Approve courier (idempotent) |
| `PATCH` | `/api/couriers/:id/reject` | ✅ JWT | `courier:reject` | Reject courier with mandatory reason |

#### Authorization Guard Chain

Every admin endpoint uses the double-guard pattern already established in `AgencyController` and `MerchantController`:

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('courier:approve')
```

- `JwtAuthGuard` → validates the Bearer token signature and expiry.
- `PermissionsGuard` → queries `userRole → role → rolePermission → permission` to check `courier:approve` is in the user's permission set. Only `PLATFORM_ADMIN` holds this permission.

#### OTP Flow

The registration flow reuses the shared `OtpService` exactly as Agency and Merchant do:

```
POST /couriers/otp/request  →  OtpService.requestOtp()  →  generates 6-digit code, stores in `otp_verifications`
POST /couriers/otp/verify   →  OtpService.verifyOtp(dto, 'COURIER_REGISTRATION_OTP')
                            →  marks record as `verified: true`
                            →  signs JWT with { phone, type: 'COURIER_REGISTRATION_OTP' }
POST /couriers/register     →  jwtService.verify(verificationToken)
                            →  validates type === 'COURIER_REGISTRATION_OTP'
                            →  validates payload.phone === dto.phone
                            →  creates Courier with approvalStatus: PENDING
```

#### Idempotent Approve Endpoint

The approve handler checks the current status before writing:

```typescript
// If already APPROVED → return current entity, no DB write
if (courier.approvalStatus === COURIER_APPROVAL_STATUS.APPROVED) {
  return new CourierEntity(courier);
}
```

This means the frontend can safely retry approve calls without side effects.

---

### Part C — Frontend Management (Angular)

#### Files Created

```
front-management/src/app/
├── shared/interfaces/
│   └── courier.interface.ts           # TypeScript types matching API response
└── pages/users/couriers/
    ├── courier-management.service.ts  # Angular HTTP service (findAll, approve, reject)
    └── couriers.component.ts          # Standalone component (signals-based)
```

#### Component Logic Highlights

- **Angular Signals** (`signal`, `computed`) for reactive, fine-grained state management — aligned with the existing `AgenciesComponent` pattern.
- **`takeUntilDestroyed(destroyRef)`** for automatic Observable cleanup on component destruction.
- **Status tabs** (`PENDING | APPROVED | REJECTED`) to filter the courier list.
- **Optimistic UI** — approved/rejected couriers are removed from the list immediately without waiting for a reload.
- **Reject Modal** — textarea input enforces `minLength: 10` on the client side (server DTO enforces `@MinLength(10)` as well — double validation).
- **Toast notifications** — success/error feedback with a 3-second auto-dismiss.
- **`processing` Set signal** — disables the action buttons per-row while an API call is in-flight to prevent double-clicks.

#### Route Registration (`app.routes.ts`)

The `/users/couriers` route was updated from `loadUnderDevelopment` to lazy-load the real `CouriersComponent`:

```typescript
{
  path: 'couriers',
  loadComponent: () =>
    import('./pages/users/couriers/couriers.component').then(
      (m) => m.CouriersComponent
    ),
}
```

#### Unit Tests (`courier.service.spec.ts`)

15 test cases covering:
- `register()`: invalid token, wrong token type, phone mismatch, duplicate phone, duplicate email, successful creation with PENDING status.
- `approve()`: not found, idempotent on APPROVED, rejects REJECTED couriers, updates PENDING couriers with audit fields.
- `reject()`: not found, blocks APPROVED couriers, persists rejection reason and rejectedBy.

---

## 2. Technical Justification (The 'Why')

### Database Design Decisions

**Why reuse the `ApprovalStatus` Prisma enum instead of a custom string or a new enum?**

The codebase already defines `ApprovalStatus { PENDING, APPROVED, REJECTED }` and uses it for both `Agency` and `Merchant`. Reusing it maintains schema consistency, shares the same type safety across the ORM, and avoids Prisma migration complexity of defining a near-identical enum.

**Why separate `approvalStatus` from `onlineStatus`?**

These represent two fundamentally different dimensions:
- `approvalStatus` is **one-time and immutable** in practice — it represents the KYC/onboarding outcome.
- `onlineStatus` is **mutable and operational** — it changes every time a courier goes online or offline.

Mixing them into a single field (e.g., a `status` string of `'available' | 'offline' | 'pending'`) would make it impossible to efficiently index or query both dimensions simultaneously. The composite index `@@index([approvalStatus, onlineStatus])` enables the order dispatch query: "find the nearest APPROVED + ONLINE courier" in a single indexed scan.

**Why `@@index([approvalStatus])` as a dedicated index?**

The admin dashboard's primary view is the **approval queue** — `WHERE approvalStatus = 'PENDING'`. Without this index, every page load of the courier management dashboard would trigger a full sequential scan of the entire `couriers` table. With thousands of registered couriers, this becomes a performance bottleneck. The index reduces this to an `Index Scan` with O(log n) lookup.

**Why soft delete (`deletedAt`) instead of hard delete?**

Audit trail compliance: a deleted courier may still be referenced in historical `Order` records (as the `courierId` foreign key). Hard-deleting the courier row would orphan those references. Soft delete (`deletedAt IS NOT NULL`) allows the record to persist for referential integrity while being hidden from all active queries that include `.excludeDeleted()` in the query builder.

**Why `@unique` on both `phone` and `email`?**

These are business identity fields — a person cannot register as two different couriers with the same contact details. Database-level unique constraints enforce this even if application-level validation is bypassed (e.g., concurrent requests passing the service-layer check simultaneously before the DB write).

---

### Why the Reject API Requires a Mandatory Reason

The `reason` field in `RejectCourierDto` has `@IsNotEmpty()` and `@MinLength(10)` decorations, and the service validates `dto.reason` is set. This is a deliberate business-rule decision, not just a validation checklist item:

1. **Regulatory compliance**: In Vietnam's gig-economy context, a delivery platform that rejects a driver without explanation exposes itself to disputes and potential legal liability under labor protection guidelines.

2. **Conversion rate**: If a courier's application is rejected with a reason (e.g., "License plate photo is unreadable — please re-upload"), they can correct and re-apply. A silent rejection results in permanent drop-off. This directly impacts platform driver supply.

3. **Audit trail**: The `rejectionReason` field is stored in the database alongside `rejectedBy` and `rejectedAt`. This enables admin teams to review patterns in rejections (e.g., "20% of rejections are for blurry photos → we should add in-app guidance").

---

### Engineering Trade-offs

Due to the compressed timeline (1 day for this task), I made the following prioritization decisions:

**What was fully implemented (100% complete):**
- ✅ Prisma schema with all required fields, indexes, and constraints.
- ✅ Full backend: module, controller, service, DTOs, entity, query builder, constants.
- ✅ OTP-based registration flow reusing shared `OtpService`.
- ✅ Role-based authorization via `JwtAuthGuard + PermissionsGuard` on all admin endpoints.
- ✅ Idempotent approve endpoint.
- ✅ Mandatory-reason reject with `@MinLength(10)` validation.
- ✅ Unit tests (15 cases) covering all critical flows.
- ✅ Angular service with typed HTTP calls.
- ✅ Angular component with signals, optimistic UI, reject modal.
- ✅ Route registration in `app.routes.ts`.

**What was deprioritized due to time constraints:**
- ⚠️ **UI/CSS polish**: The component template includes inline styles sufficient to demonstrate the feature logic. In a production sprint, I would extract styles to a dedicated `.scss` file, use the project's shared `DataTableComponent` and design tokens from `shared-ui`.
- ⚠️ **Pagination in the component**: The current implementation sends the correct `page`/`limit` to the API but uses a minimal HTML pagination bar. The project's `DataTableComponent` with the `TablePagination` interface would be used in the production version.
- ⚠️ **Full E2E test**: An E2E test for the registration → admin approval flow was not written. The unit tests cover service-level logic; an E2E would use Cypress/Playwright to test the full HTTP cycle.
- ⚠️ **OTP rate limiting**: The `OtpService` does not currently enforce a request rate limit (e.g., max 3 OTP requests per phone per 10 minutes). This was identified as a Nice-to-Have in the task specification and would be the next sprint item.
- ⚠️ **Email notification to courier on approval/rejection**: The `approve()` and `reject()` services include a `// TODO: Send email` comment. An `EmailService` integration (e.g., AWS SES, SendGrid) would be wired in the next iteration.

---

## Verification Plan

### Run Database Migration

```bash
npx prisma migrate dev --name add_courier_approval_flow
npx prisma db seed
```

### Run Unit Tests

```bash
npx nx test api-service --testFile=src/app/courier/courier.service.spec.ts
```

### Manual API Testing (curl)

```bash
# 1. Request OTP
curl -X POST http://localhost:3000/api/couriers/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "0901234567"}'

# 2. Verify OTP (use code from server logs during dev)
curl -X POST http://localhost:3000/api/couriers/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "0901234567", "code": "123456"}'

# 3. Register courier
curl -X POST http://localhost:3000/api/couriers/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user_access_token>" \
  -d '{"name":"Tran Van B","phone":"0901234567","email":"courier@test.com","vehicleType":"motorbike","verificationToken":"<token_from_step2>"}'

# 4. Admin: approve courier
curl -X PATCH http://localhost:3000/api/couriers/<externalId>/approve \
  -H "Authorization: Bearer <admin_access_token>"

# 5. Admin: reject courier
curl -X PATCH http://localhost:3000/api/couriers/<externalId>/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{"reason": "License plate image is blurry and cannot be verified."}'
```

### Frontend Verification

Navigate to `http://localhost:4201/users/couriers` in the management portal while logged in as `PLATFORM_ADMIN`. The table should display `PENDING` couriers with Approve/Reject action buttons.
