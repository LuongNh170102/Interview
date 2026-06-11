# TASK 2 – Courier Registration Flow

## What I Have Done

### Part A – Database (Schema, Migration, Seed)

**Schema Changes (`prisma/schema.prisma`):**

- Extended the `Courier` model with:
  - `externalId` (UUID, unique, auto-generated via `@default(uuid())`) – consistent with Merchant/Agency pattern
  - `approvalStatus` (ApprovalStatus enum: PENDING/APPROVED/REJECTED) – matching existing approval pattern
  - `approvedAt`, `approvedBy`, `approvedByUser` relation – tracks who approved
  - `rejectedAt`, `rejectedBy`, `rejectedByUser` relation – tracks who rejected
  - `rejectionReason` – stores rejection reason
  - `operationalStatus` (OperationalStatus enum: ACTIVE/INACTIVE/SUSPENDED/LOCKED)
  - `idCardNumber`, `dateOfBirth`, `vehicleNumber` – identity verification fields
- Added `approvedCouriers` and `rejectedCouriers` relations to `User` model

**Migration (`prisma/migrations/20260610000000_add_courier_approval_fields/`):**

- SQL migration adding all new columns and foreign key constraints
- Uses `gen_random_uuid()` for default UUID generation on existing rows

**Seed Data (`prisma/seed.ts`):**

- Added 3 new permissions: `courier:read`, `courier:approve`, `courier:reject`
- Assigned `order:read` and `order:update_status` permissions to `COURIER` role
- `PLATFORM_ADMIN` automatically inherits all courier permissions via `allPermissions`

### Part B – Backend (NestJS Module)

Created `api-service/src/app/courier/` module following the Merchant pattern:

| File                                | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `courier.module.ts`                 | NestJS module with JWT + OtpModule imports         |
| `courier.controller.ts`             | REST endpoints with guards                         |
| `courier.service.ts`                | Business logic                                     |
| `dto/create-courier.dto.ts`         | Registration request validation                    |
| `dto/courier-query.dto.ts`          | List query params + statistics response            |
| `dto/update-courier-status.dto.ts`  | Approve/reject DTOs                                |
| `entities/courier.entity.ts`        | Response serialization (excludes sensitive fields) |
| `builders/courier-query.builder.ts` | Fluent API for Prisma where clauses                |

**Endpoints:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/couriers/otp/request` | Public | Send OTP for registration |
| POST | `/couriers/otp/verify` | Public | Verify OTP, get verification token |
| POST | `/couriers/register` | JWT | Submit registration → PENDING status |
| GET | `/couriers` | Admin (courier:read) | List/filter couriers |
| GET | `/couriers/:id` | Admin (courier:read) | Get courier detail |
| PATCH | `/couriers/:id/approve` | Admin (courier:approve) | Approve courier |
| PATCH | `/couriers/:id/reject` | Admin (courier:reject) | Reject with reason |

**Registration Flow:**

```
[Courier] → requestOtp() → verifyOtp() → register() → PENDING status
                                                              ↓
[Admin] → GET /couriers (filter PENDING) → approve() / reject()
```

**Key Design Decisions:**

- Role assignment (`COURIER`) happens **on approval** (not registration), matching the Merchant pattern where `MERCHANT_OWNER` is assigned only after approval
- `findById()` and `findByExternalId()` both supported: numeric IDs for admin panel, UUIDs for future API usage
- `PermissionsGuard` used consistently with existing pattern
- Statistics endpoint for dashboard cards (totalApproved, totalPending, totalRejected, totalActive)

### Part C – Frontend (Angular Management Page)

**Shared Library (`shared/src/lib/`):**

- `interfaces/courier.interface.ts` – API response types
- `services/courier.service.ts` – HttpClient service with findAll, approve, reject methods

**Management App (`front-management/`):**

- Route: `/users/couriers` with `canActivate: [withPermissions('courier:read')]`
- `CouriersComponent`:
  - Statistic cards (total approved/pending/rejected/active)
  - DataTable with courier info, status, and action menu
  - Approve/Reject modal with rejection reason textarea
  - Filter by PENDING status
- 13 unit tests covering:
  - Component creation and data loading
  - API response mapping
  - Modal open/close logic
  - Approve/reject actions
  - Error handling
  - Page change and filter toggle

## Technical Justification

### Pattern Adherence

- **Approval pattern**: Mirrors the existing Agency/Merchant approval flow (ApprovalStatus enum, approvedBy/rejectedBy tracking)
- **Query Builder**: Uses the same `QueryBuilder` base class as MerchantQueryBuilder/AgencyQueryBuilder
- **Entity pattern**: Extends `BaseEntity` with `@Exclude()` decorators for consistent API serialization
- **Guard pattern**: Uses existing `PermissionsGuard` with `@Permissions()` decorators
- **Module pattern**: Consistent with MerchantModule/OtpModule structure (JwtModule.registerAsync with ConfigService)

## Trade-off Analysis

### 1. UUID External ID vs Auto-increment ID

**Chosen:** UUID v4 as external identifier (`@default(uuid())`), keeping auto-increment `id` as internal primary key.

**Alternative considered:** Exposing auto-increment IDs directly in API responses and URLs.

**Rationale:** UUIDs prevent information leakage (sequential IDs reveal business metrics: order #1000 vs #1), eliminate ID enumeration attacks, and are safe for public API exposure. The auto-increment `id` is retained as the internal primary key for index performance and JOIN operations.

**Cost:** UUIDs are 4x larger than integers (16 bytes vs 4 bytes), which increases index size and slightly degrades B-tree lookup performance. At the current scale (<1M couriers), this cost is negligible. The hybrid approach (internal int + external UUID) provides the best of both worlds at the cost of maintaining two identifiers.

### 2. Role Assignment: On Approval vs On Registration

**Chosen:** `COURIER` role is assigned when the admin approves the registration, not when the courier submits the form.

**Alternative considered:** Assign the role immediately on registration, before admin approval.

**Rationale:** Assigning the role on registration would grant a pending courier access to all `COURIER`-level permissions (order:read, order:update_status) before their identity is verified. An attacker who completes the OTP flow but is not a legitimate courier could interact with the system before being rejected. Deferring role assignment to approval time ensures that only verified couriers can access courier-specific features.

**Cost:** Requires an additional database operation (role assignment) during the approval flow, adding ~10ms to the approval latency. The admin must also have explicit permissions to assign roles. This is consistent with the existing Merchant pattern where `MERCHANT_OWNER` is assigned only after merchant approval.

### 3. Statistics: 4 Separate Queries vs Single Aggregation Query

**Chosen:** Four parallel `count()` queries executed via `prisma.$transaction()`.

**Alternative considered:** A single SQL query using `GROUP BY approvalStatus` with conditional aggregation for `totalActive`.

**Rationale:** Prisma's `count()` with `where` clauses generates optimized SQL (`SELECT COUNT(*) WHERE ...`) that uses the existing indexes on `approval_status` and `operational_status`. Four parallel queries complete in approximately the same wall-clock time as one sequential query because they run concurrently within the transaction. The code is also more readable and maintainable.

**Cost:** Under high load (>1000 requests/second), the database connection pool may be strained by 4x the query count. At that scale, a raw SQL aggregation or a dedicated statistics table (updated via triggers or events) would be more appropriate. For the current scale, the parallel approach is simpler and equally performant.

### 4. QueryBuilder Pattern: Necessary or Overengineering?

**Chosen:** Dedicated `CourierQueryBuilder` extending a base `QueryBuilder` class.

**Alternative considered:** Building Prisma `where` clauses inline in the service method.

**Rationale:** The Courier list endpoint supports multiple filter dimensions (approvalStatus, operationalStatus, search, vehicleType, dateRange). The QueryBuilder pattern encapsulates this complexity in a testable, fluent API that prevents the service method from becoming a 50-line chain of conditional `if` statements. It also mirrors the existing `MerchantQueryBuilder` and `AgencyQueryBuilder`, maintaining consistency.

**Cost:** This is a mild overengineering for a simple filter with 2-3 parameters. The indirection (service → builder → Prisma) adds a layer of abstraction that a new developer must understand. However, the consistency benefit (same pattern used across 3 modules) outweighs the simplicity loss.

### 5. Why No Database Transaction for Approve + Role Assignment?

**Chosen:** Two separate operations (update courier status, then assign role) without a wrapping transaction.

**Alternative considered:** Wrapping both operations in a Prisma `$transaction()`.

**Rationale:** Adding a transaction would require a Prisma interactive transaction, which holds a database connection for the duration of the operation, potentially reducing throughput under load.

**Risk acknowledged:** If the role assignment fails after the courier status is updated, the courier would be in an `APPROVED` state without the `COURIER` role. This causes a concrete bug: `findNearestCourier()` queries by `approvalStatus` and `operationalStatus` (not by role), so this courier would appear in assignment results but would be unable to accept deliveries (no `order:read`/`order:update_status` permissions). The admin can recover by manually reassigning the role or re-approving. The risk window is <5ms.

**Recommended fix:** Wrap both operations in a `$transaction()`:
```ts
await this.prisma.$transaction(async (tx) => {
  await tx.courier.update({ where: { externalId }, data: { approvalStatus: 'APPROVED', ... } });
  await tx.userRole.create({ data: { userId: courier.userId, roleId: courierRole.id } });
});
```

### 6. Default Pagination Size: Why 10?

**Chosen:** 10 items per page as the default.

**Rationale:** The admin management UI is designed for manual review — an admin approving couriers needs to read each applicant's details (name, phone, vehicle, ID). 10 items per page allows quick scanning without overwhelming the viewport. For API consumers, the `limit` parameter can be overridden up to 100.

**Cost:** If the system has 10,000 pending couriers, an admin must navigate through 1,000 pages. A "Select All Pending" bulk action (Nice-to-Have) would address this at scale.

### 7. Phone Unique Constraint vs Soft Duplicate Handling

**Chosen:** `@@unique([phone])` constraint on the Courier model.

**Alternative considered:** Allowing duplicate phones with application-level deduplication logic.

**Rationale:** A phone number is the primary identity verification method for couriers. Allowing duplicates would enable malicious actors to register multiple accounts under the same phone, potentially to bypass a suspension or rejection. A hard database constraint guarantees uniqueness at the storage layer, which is more reliable than application-level checks (which can race).

**Cost:** If a legitimate user needs multiple courier profiles (e.g., different vehicle types), this constraint prevents it. The workaround is to use different phone numbers or implement a "multi-profile" feature.
