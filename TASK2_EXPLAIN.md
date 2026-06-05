# TASK2_EXPLAIN

## 1. What You Have Done (The How)

- Implementation details: extended the Prisma schema and migration for the courier domain with `externalId`, approval status, operational status, availability status, and full approval/rejection audit fields.
- Implementation details: created a dedicated NestJS courier slice with module, controller, service, DTOs, query builder, and entity mapping.
- Implementation details: reused the existing OTP infrastructure for phone verification and introduced a courier-specific verification token type before courier registration is accepted.
- Implementation details: implemented both sides of the flow: courier self-service endpoints and admin review/approval endpoints.
- Pattern adherence: kept the existing backend module -> controller -> service -> DTO/entity structure and reused the shared Angular service/interface pattern instead of introducing task-specific one-off contracts.
- Pattern adherence: kept authorization aligned with business state by integrating courier approval changes with the existing role/permission model.
- Testing and verification: validated with Prisma checks, backend tests, production builds, and a manual approval-flow walkthrough described below.

## 2. Business Flow Implemented

- Step 1: request OTP with `POST /api/couriers/otp/request`.
- Step 2: verify OTP with `POST /api/couriers/otp/verify` and receive a verification token.
- Step 3: an authenticated user registers a courier profile with `POST /api/couriers/register`.
- Step 4: the new courier starts as `PENDING`, `INACTIVE`, and `OFFLINE`.
- Step 5: admins review the pending queue from the management UI or admin API.
- Step 6: approval sets the courier to `APPROVED` and `ACTIVE`, stores approval audit data, and assigns the courier role if it does not exist yet.
- Step 7: rejection requires a reason, stores rejection audit data, forces the courier back to `INACTIVE` and `OFFLINE`, and removes the courier role.
- Step 8: the courier can update availability only when both business conditions are satisfied: approved and operationally active.

## 3. API Surface Delivered

- `POST /api/couriers/otp/request`
- `POST /api/couriers/otp/verify`
- `POST /api/couriers/register`
- `GET /api/couriers/me`
- `PATCH /api/couriers/me/availability`
- `GET /api/couriers`
- `GET /api/couriers/:id`
- `PATCH /api/couriers/:id`
- `PATCH /api/couriers/:id/approval`
- `DELETE /api/couriers/:id`

These endpoints are guarded with the project’s existing JWT and permission model. The self-service endpoints use courier permissions, while admin endpoints use `system:manage_users`.

## 4. Frontend and Shared Integration

- Added shared courier interfaces and a shared courier service so the admin UI consumes typed contracts instead of duplicating request/response shapes.
- Registered a real admin route at `/users/couriers` in `front-management`.
- Built a pending-review page that loads courier statistics, supports search, pagination, and focuses the table on `PENDING` approvals.
- Implemented approve and reject actions in the UI, with a required rejection reason before reject is submitted.
- Added optimistic queue updates for approval decisions so reviewed couriers disappear from the pending list immediately and roll back if the API call fails.

## 5. Final Cleanup and Optimization

- Tightened `PATCH /api/couriers/me/availability` so suspended or inactive couriers cannot mark themselves `ONLINE` or `BUSY`.
- Kept approval and operational status separate. This allows the system to approve a courier at the business level while still supporting later operational disabling without deleting the profile.
- Reused a query builder for filtering/search logic instead of scattering `where` clauses across controller methods.
- Kept the pending-review UI responsive by applying optimistic updates locally and only falling back to a reload when the current page needs to be repopulated.

## 6. Validation and Verification

- `npx prisma validate`
- `npx prisma generate`
- `npx nx test api-service --runInBand`
- `CI=1 npx nx build api-service --configuration=production --skip-nx-cache --output-style=static`
- `CI=1 npx nx build front-management --configuration=production --skip-nx-cache --output-style=static`

Recommended manual verification flow:

- Request and verify OTP.
- Register a courier profile with the verification token.
- Open the management UI pending courier page.
- Approve one courier and reject another with a reason.
- Call `GET /api/couriers/me` and `PATCH /api/couriers/me/availability` using an approved courier account.

## 7. Known Limits and Honest Scope

- This task currently delivers the courier backend flow and the management approval UI. It does not add a dedicated courier mobile/web application.
- OTP behavior still relies on the project’s shared OTP implementation, so any project-wide OTP constraints still apply here.
- Live manual testing still requires the local API, Postgres, and MinIO stack to be running.

## 8. Technical Justification (The Why)

- Technical decisions:
  - Phone verification before registration prevents users from claiming courier profiles with unverified phone numbers.
  - Separating approval status from operational status gives the business team a cleaner control model than a single flag.
  - Applying optimistic queue updates in the management UI keeps the pending-review workflow fast without waiting for a full reload after every decision.
- Security and stability:
  - Assigning and removing the courier role during approval changes keeps authorization aligned with business state.
  - Requiring a rejection reason and preserving approval/rejection audit fields improves traceability for admin actions.
  - Shared contracts reduce drift between backend payloads and Angular consumers, which lowers the chance of silent UI/API mismatches.
- Trade-offs:
  - The optimistic UI path adds a little more state-management complexity because the component must capture and restore snapshots on failure.
  - This task still focuses on the courier approval flow inside the existing management app rather than introducing a separate courier-facing application.
  - Reusing the shared OTP implementation kept delivery time low, but it also means courier registration inherits any current platform-wide OTP constraints.
