# TASK 2 EXPLAIN - COURIER REGISTRATION & APPROVAL FLOW

## 1. Database Schema Design
The courier data models are declared in prisma/schema.prisma:

* Courier:
  - id: Int, Primary Key
  - externalId: String (UUID), Unique
  - name: String
  - phone: String, Unique
  - email: String, Unique
  - vehicleType: String (MOTORBIKE, CAR, BICYCLE)
  - licensePlate: String
  - approvalStatus: ApprovalStatus (PENDING, APPROVED, REJECTED)
  - rejectedReason: String (nullable)
  - operationalStatus: OperationalStatus (ACTIVE, INACTIVE)
  - createdAt: DateTime
  - updatedAt: DateTime

---

## 2. API Endpoints

### Public Endpoints
* POST /api/couriers/send-otp: Triggers six-digit registration OTP verification code.
* POST /api/couriers/verify-otp: Validates registration OTP verification code.
* POST /api/couriers/register: Submits courier registration profile details.

### Management Endpoints
* GET /api/couriers: Admin fetch with search, status filtering, and pagination support.
* PATCH /api/couriers/:id/approve: Approves pending courier.
* PATCH /api/couriers/:id/reject: Rejects courier with rejection reason.
* GET /api/couriers/stats: Returns courier operational statistics summary.

---

## 3. Registration Flow Diagram (ASCII Flowchart)

[Courier Client] ---> (POST /send-otp) ---> [Backend: Generate OTP & Save]
                                                   |
[Courier Client] <--- (OTP sent to phone) <--------+
      |
      +---> (POST /verify-otp) ---> [Backend: Verify & Return Token]
      |
      +---> (POST /register) ------> [Backend: Create PENDING Courier]

---

## 4. Approval Flow Diagram (ASCII Flowchart)

[Admin Portal] ---> (GET /couriers) ---> [Display PENDING Couriers]
      |
      +---> [Approve Clicked] ---> (PATCH /approve) ---> [Status: APPROVED]
      |
      +---> [Reject Clicked] ---> (PATCH /reject) ---> [Status: REJECTED]

---

## 5. Verification & Unit Tests
A comprehensive test suite was written in `api-service/src/app/courier/courier.service.spec.ts` to verify database integrations, business validations, registration, and status overrides.
All database models, service states, and mock responses have been verified for completeness.

---

## 6. Pattern Adherence & Technical Justification

### Pattern Adherence
- Followed NestJS modular structure, isolating DTOs, entities, and services.
- Leveraged the `CourierQueryBuilder` query builders pattern to construct dynamic pagination and filter conditions.
- Followed Angular component state isolation guidelines utilizing computed signals to derive statistics and filter lists.

### Decision Making
- Handled OTP verification as a one-time verification mechanism to obtain an authorization token before registration profiles are accepted. This prevents registration endpoints from being hit directly with unverified contact information.

### Security & Stability
- Added database constraints (unique email and phone numbers) to ensure data sanitization.
- Integrated permissions checks (`courier:read`, `courier:write`) in route controllers.

### Engineering Trade-offs
- Deprioritized live SMS integration for OTP delivery due to offline environment limits; fallback verification is simulated via mock service storage logs.
