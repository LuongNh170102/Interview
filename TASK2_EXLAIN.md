# TASK 2 – Implement Courier Registration Flow

## Part A – Database Design

### 1. Analyze existing Courier model and compare with Agency/Merchant

- **Structural Alignment:** Synchronized the `Courier` registration flow with `Agency` and `Merchant` models using a standardized `ApprovalStatus` enum (`PENDING`, `APPROVED`, `REJECTED`).
- **Auditability:** Added tracking fields (`approvedBy`, `rejectedBy`) to ensure accountability for every partner onboarded.
- **Operational Nature:** Unlike static businesses, the `Courier` model incorporates `currentLocation` (JSON) and `vehicleType` to support real-time mobility.
- **Identity Mapping:** Enforced a strict 1-to-1 relationship with `User` accounts, whereas Merchants use a `UserRole` mapping for multiple managers.

### 2. Extend schema if required fields are missing

- **Approval Fields (`approvalStatus`, `rejectionReason`):** Added to support the manual verification process by Administrators.
- **Audit Fields (`approvedAt`, `approvedBy`, `rejectedAt`, `rejectedBy`):** Implemented to maintain a historical log of who authorized the courier and when.
- **Security Field (`externalId` UUID):** Introduced to prevent **ID Enumeration** attacks in public APIs, masking the internal database auto-increment sequence.
- **State Field (`operationalStatus`):** Separated administrative approval from active work status (Online/Offline) for real-time order matching.

### 3. Create Prisma migration for schema changes

- **Action:** Executed `npx prisma migrate dev --name extend_courier_model`.
- **Justification:** Generates a version-controlled SQL file that ensures database consistency across development, staging, and production environments.

### 4. Update seed.ts with permissions courier:\* and role mapping

- **Location:** `prisma/seed.ts` (Lines 229-265).
- **Implementation:** Registered CRUD permissions for the `courier` resource and mapped them to `PLATFORM_ADMIN` and `COURIER` roles to enable RBAC (Role-Based Access Control).

### 5. Add unique constraints for phone/email if needed

- **Location:** `prisma/schema.prisma` (Line 500).
- **Implementation:** Applied `@unique` to the `phone` field.
- **Justification:** Enforces "One Account Per Person" at the database level, preventing duplicate registrations and potential fraud.

### 6. Add indexes to improve query performance

- **Location:** `prisma/schema.prisma` (Lines 527-529).
- **Implementation:** Added `@@index` on `approval_status`, `operational_status`, and `external_id`.
- **Justification:** Optimizes search speed for Admin filtering and real-time courier-to-order matching, preventing full table scans.

### 7. Implement soft delete if appropriate

- **Location:** `prisma/schema.prisma` (Line 519).
- **Implementation:** Added `deletedAt` field (`DateTime?`).
- **Justification:** Ensures referential integrity. Historical order data is preserved even if a courier profile is deactivated.

## Part B – Backend API

### 1. Courier Module Architecture

- **Implementation:** Developed a standalone `CourierModule` following the project's core architecture:
  - **Controller:** Handles HTTP requests and routing.
  - **Service:** Encapsulates business logic (Registration, Approval, Reject) (line 14 - 46).
  - **DTO (Data Transfer Objects):** Validates incoming request payloads using `class-validator`.
  - **Entity/QueryBuilder:** Manages database interactions and complex filtering for Admin views.

### 2. OTP Registration Flow

- **Logic:** Replicated the `Agency` registration pattern.
- **Process:** 1. User submits phone number. 2. System generates/sends OTP. 3. User verifies OTP. 4. Upon success, a `User` account is created with the `COURIER` role, and a `Courier` profile is initialized with `PENDING` status.
- **Location:** courier.controller

### 3. CRUD & Admin Management APIs

- **Endpoints:** Implemented standard CRUD (Create, Read, Update, Delete) for courier profiles.
- **Approval Logic:** Created dedicated endpoints:
  - `PATCH /couriers/:id/approve`: Updates status to `APPROVED`.
  - `PATCH /couriers/:id/reject`: Updates status to `REJECTED` and requires a `rejectionReason` in the body.
- **Authorization:** Secured endpoints using `@Roles(Role.PLATFORM_ADMIN)` and `@Permissions('courier:update')`.
- **Location:** courier.service

### 4. Validation

- **Input Validation:** Enforced strict types for phone numbers, names, and rejection reasons via DTOs.
- **Location:**: register-courier.dto
