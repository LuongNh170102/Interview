# TASK 2 – Courier Registration Flow

## Part A – Database Design

### What I Did
- Analyzed existing `Courier` model vs `Agency`/`Merchant` models
- Found `Courier` was missing `approvalStatus`, `rejectionReason`, `approvedBy/rejectedBy/approvedAt/rejectedAt`
- Found `status` and `vehicleType` were raw `String?` instead of enums
- Added `externalId` for consistent external API identification
- Added `unique` constraints on `phone` and `email`
- Created 2 Prisma migrations
- Updated `seed.ts` with 4 new `courier:*` permissions mapped to PLATFORM_ADMIN role

### Why
Consistency with Agency/Merchant patterns ensures the approval flow works the same way across all partner types. Using enums at the DB level prevents invalid status values from being stored.

---

## Part B – Backend API

### What I Did
- Created `courier` module: `Module`, `Controller`, `Service`, `DTO`, `Entity`, `QueryBuilder`
- OTP flow: `POST /api/couriers/otp/request`, `POST /api/couriers/otp/verify`
- CRUD: `GET /api/couriers`, `GET /api/couriers/:id`, `POST /api/couriers/register`
- Approval: `PATCH /api/couriers/:id/approve`, `PATCH /api/couriers/:id/reject`
- Rejection requires `rejectionReason` (validated via DTO)
- All admin endpoints protected with `JwtAuthGuard` + `PermissionsGuard`
- Approval endpoints check `approvalStatus === PENDING` before proceeding

### Why
Following the Agency module pattern ensures consistency. Checking PENDING status before approving/rejecting prevents double-processing.

### Trade-offs
- OTP rate limiting (Nice to Have) deprioritized — basic expiration handled by OtpService
- Audit logging deprioritized due to time constraints

---

## Part C – Frontend

### What I Did
- Created `CourierService` in shared library with `findAll`, `approve`, `reject`
- Created `CouriersComponent` with pending courier list, approve action, reject modal
- Added route at `partners/couriers` in `app.routes.ts`
- Added courier tab to `PARTNERS_TAB_CONFIG` in `menu.config.ts`
- Wrote 7 unit tests covering all key interactions

### Why
Reusing `DataTableComponent` and following Agency component pattern ensures UI consistency. Modal for rejection forces admins to provide a reason before confirming.

### Trade-offs
- Toast notifications (Nice to Have) deprioritized — console.error used instead
- Optimistic UI updates deprioritized in favor of simpler reload-after-action