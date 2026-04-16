# Task 2

## Part A – Database Design

### Analyze the existing Courier model and compare it with Agency/Merchant models

- Basically Couriers table didn't have externalId, approvalStatus, approvedAt, approvedBy, rejectedAt, rejectedBy, rejectionReason which is used for approval/rejection/deletion
- Even though a user can own a multiple agencies and multiple merchants, they can only be a single courier
- None of them have any indexes

### Extend schema if required fields are missing

- These fields were extended to match the requirements

<!-- to match the Agency/Merchant model and for soft delete -->
externalId      String   @unique @default(uuid()) @map("external_id") @db.Uuid

<!-- for approval flow for when the courier need to be approved like Agency/Merchant -->
approvalStatus    ApprovalStatus    @default(PENDING) @map("approval_status")
approvedAt        DateTime?         @map("approved_at")
approvedBy        Int?              @map("approved_by")

<!-- for rejection flow for when the courier need to be rejected like Agency/Merchant -->
rejectedAt        DateTime?         @map("rejected_at")
rejectedBy        Int?              @map("rejected_by")
rejectionReason   String?           @map("rejection_reason") @db.Text
  
<!-- I changed courier's status column type to enum for consistency so that the the user cannot change it to a diffirent type even without using API -->
activeStatus CourierActiveStatus    @default(AVAILABLE) @map("active_status") // 'available' | 'busy' | 'offline'
statusChangedAt   DateTime?         @map("status_changed_at")

<!-- added email and made both phone and email unique, which will prevent duplicate courier -->
phone           String?     @unique
email           String?     @unique

<!-- I changed courier's vehicleType column type to enum for consistency so that the user cannot change it to a diffirent type even without using API -->
vehicleType     VehicleType @map("vehicle_type") // 'bike' | 'motorbike' | 'car'

<!-- I added vehiclePlate column for logic -->
vehiclePlate    String      @map("vehicle_plate")

<!-- I added deletedAt column because of the Implement soft delete if appropriate requirement -->
deletedAt       DateTime?   @map("deleted_at")

### Update seed.ts with permissions courier:* and role mapping

- The seed.ts file were updated with new permissions
<!-- Courier's permissions -->
{ resource: 'courier', action: 'read' },
{ resource: 'courier', action: 'create' },
<!-- update_status can be used for both reject and approve role to prevent redundan rows -->
{ resource: 'courier', action: 'update_status' },
{ resource: 'courier', action: 'delete' },

<!-- Map Courier's permissions to Courier in rolePermissionsMap -->
```ts
{
    role: 'COURIER',
    perms: [
        getPerm('order', 'read'),
        // couriers cannot see other couriers but only themselves
        getPerm('courier', 'read'),
    ].filter(Boolean),
}
```

### Add indexes to improve query performance

<!-- The reason I added these column as indexes is because when admin need to approve/reject/delete the server need to query for externalId -->
<!-- The requirements ask to add filtering by registration date or status, the registration date can be queried with createdAt column and status can be approvalStatus or activeStatus column, which can be approvalStatus/activeStatus/createdAt or combinations of 2 columns or all 3 columns at the same time, so this is the most optimized keys order I can come up with to increase query performance for all the combinations -->
@@index([externalId])
@@index([createdAt])
@@index([activeStatus])
@@index([approvalStatus, activeStatus, createdAt])

## Part B - Backend API

### Create courier module following system architecture (Module, Controller, Service, DTO, Entity, QueryBuilder)

<!-- for this requirements I read the project's code and reuse the necessary files from agency/merchant Module, Controller, Service, DTO, Entity, QueryBuilder only changing the column to match the couriers table column types so that it would remain similar to the project's code structure -->

### Implement OTP registration flow similar to Agency registration

<!-- for this requirements I read the AgencyService file code and reused it so that it would remain similar to the project's code structure -->

### Create CRUD APIs for courier management

<!-- for this requirements I read the project's code and reused the necessary files from agency/merchant modules so that it would remain similar to the project's code structure -->

### Implement validation and role‑based authorization

<!-- for this requirements I follow the AgencyController/MerchantController file to reuse their UseGuard and Permissions decorators -->
```ts
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('courier:read')
```

### Provide endpoints for Admin approval and rejection

<!-- I added it with HTTP patch resource because updating status only change a few field instead of replacing the entire resources and also made it idempotent -->

### Rejection must include a rejection reason

<!-- When approving a courier, a reason is not needed in UpdateStatusDto so i made rejectionReason as optional, however when rejecting a courier rejectionReason is required so I decided to check whether the status is REJECT and rejectionReason is empty in service instead, and if they are I throw an Exception -->

### Add OTP expiration and rate limiting

## Frontend Management

### Create Pending Courier Approvals page & Allow Admin to approve couriers directly from the list

<!-- I read the frontend-management/src/app/pages/partners/merchants and reused most of it's code in frontend-management/src/app/pages/users/couriers to adhere to the project's structure to show courier list with all the necessary columns as well as delete/approve/reject action for each row, I call to onMenuAction method to show all the actions for the admin to approve/reject/delete the courier directly, I also registered the /users/couriers route in front-management/src/app/app.routes.ts with the component from frontend-management/src/app/pages/users/couriers/couriers.component.ts -->

### Reject courier via modal input for rejection reason

<!-- I decided to extend the current existing app-global-modal in front-management/src/app/shared/components/global-modal from just showing notification to also support showing input so other components can get input value from it (which admin need for rejection reason) and reusable for future uses -->

### Add pagination to the courier list

<!-- It was already present -->

### Add filtering by registration date or status

<!-- I decided to extends the front-management/src/app/shared/components/data-table to add filter type as date in order to query a range of dates, I also added private readonly headerFilterValues = signal<Record<string, unknown>>({}); for centralizing all the filter states on the header, I also updated the data-table.component.html to render options and date input from TableHeaderConfig filters option, this can be reused again in the future -->

### Display toast notifications after approve/reject actions

<!-- After realizing that this is a toast and not a modal I decided to create a global toast component in front-management/src/app/shared/components/toast which can appear in any pages and have the options to appear on 4 corner of the screen as well as have 4 statuses like modal, unlike modal it will not block the user's actions and will disappear after a specified amount of time -->

### Implement optimistic UI updates for better UX

<!-- every time i delete,approve,reject in onMenuAction method or filter couriers I always call this.loadCouriers() method again to refetch the newly updated list -->