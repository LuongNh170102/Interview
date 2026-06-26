# TASK 2 EXPLAIN - COURIER REGISTRATION & APPROVAL FLOW

## 1. Database Schema Design
The courier data models are declared in `prisma/schema.prisma`:

* **Courier**:
  - `id`: Int, Primary Key, autoincrement
  - `userId`: Int, Unique (foreign key to `User`)
  - `name`: String (nullable)
  - `phone`: String (nullable)
  - `status`: String (nullable), default: `'offline'` (operational status: `'available'` | `'busy'` | `'offline'`)
  - `vehicleType`: String (nullable) (`'bike'` | `'motorbike'` | `'car'`)
  - `currentLocation`: Json (nullable)
  - `createdAt`: DateTime, default: `now()`
  - `updatedAt`: DateTime (nullable)
  - `deletedAt`: DateTime (nullable) (for soft delete)
  - `approvalStatus`: ApprovalStatus (enum: `PENDING`, `APPROVED`, `REJECTED`), default: `PENDING`
  - `approvedAt`: DateTime (nullable)
  - `approvedBy`: Int (nullable) (references admin user ID)
  - `rejectedAt`: DateTime (nullable)
  - `rejectedBy`: Int (nullable) (references admin user ID)
  - `rejectionReason`: String (nullable, text)


## 2. API Endpoints

### Public / Courier Endpoints
* `POST /api/couriers/otp/request`: Triggers registration OTP code verification.
* `POST /api/couriers/otp/verify`: Validates OTP and returns a JWT verification token.
* `POST /api/couriers/register`: Submits courier registration profile (requires validation token).

### Management / Admin Endpoints
* `GET /api/couriers`: Admin fetch with search, status filtering, pagination, and optional statistics computation (`hasStatistics=true`).
* `GET /api/couriers/:id`: Fetches detailed profile of a single courier.
* `PATCH /api/couriers/:id/status`: Approves or rejects a courier.
  - Approve payload: `{ "status": "APPROVED" }` (sets operational status to `'available'` and grants `COURIER` system role).
  - Reject payload: `{ "status": "REJECTED", "rejectionReason": "..." }` (requires rejection reason, sets operational status to `'offline'`).


## 3. Registration Flow Diagram (ASCII Flowchart)


[Courier Client] ---> (POST /otp/request) ---> [Backend: Generate OTP & Save]
                                                        |
[Courier Client] <--- (OTP sent to phone) <-------------+
      |
      +---> (POST /otp/verify) ---> [Backend: Verify & Return JWT Token]
      |
      +---> (POST /register) ------> [Backend: Create PENDING Courier Profile]



## 4. Approval Flow Diagram (ASCII Flowchart)

[Admin Portal] ---> (GET /couriers) ---> [Display PENDING Couriers]
      |
      +---> [Approve Clicked] ---> (PATCH /status) ---> [Status: APPROVED, Role: COURIER]
      |
      +---> [Reject Clicked] ---> (PATCH /status) ---> [Status: REJECTED, Reason Saved]


## 5. Verification & Unit Tests
* **Backend Services**: Verified via NestJS service unit tests in `api-service/src/app/courier/courier.service.spec.ts`.
* **Frontend Components**: Verified via Angular component unit tests in `front-management/src/app/pages/partners/couriers/couriers.component.spec.ts`.

All database models, service states, and mock responses have been verified for completeness.


## 6. Pattern Adherence & Technical Justification

### Pattern Adherence
- Followed NestJS modular structure, isolating DTOs, entities, and services.
- Leveraged the `CourierQueryBuilder` query builders pattern to construct dynamic pagination and filter conditions.
- Followed Angular component state isolation guidelines utilizing computed signals to derive statistics and filter lists.

### Decision Making
- Handled OTP verification as a one-time verification mechanism to obtain an authorization token before registration profiles are accepted. This prevents registration endpoints from being hit directly with unverified contact information.

### Security & Stability
- Added database constraints (unique email and phone numbers) to ensure data sanitization.
- Integrated permissions checks (`system:manage_users`, `courier:read`) in route controllers.

### Engineering Trade-offs
- Deprioritized live SMS integration for OTP delivery due to offline environment limits; fallback verification is simulated via mock service storage logs.

