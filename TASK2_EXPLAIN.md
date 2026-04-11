# TASK2_EXPLAIN.md - Courier Registration Flow

## Part A – Database Design

### 1. Analyze the existing Courier model and compare it with Agency/Merchant models (Must Have)

#### Existing Courier model (trước khi chỉnh sửa):

prisma
model Courier {
id Int @id @default(autoincrement())
externalId String @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
fullName String
phone String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}

#### So sánh chi tiết với Agency và Merchant models:

Trường / Tính năng,Agency Model,Merchant Model,Courier (cũ),Courier (sau khi mở rộng),Đánh giá
approvalStatus,Có,Có,Không,Có,Must Have
operationalStatus,Có,Có,Không,Có,Must Have
rejectionReason,Có,Có,Không,Có,Must Have
approvedBy / rejectedBy,Có,Có,Không,Có,Must Have
approvedAt / rejectedAt,Có,Có,Không,Có,Must Have
Quan hệ 1:1 với User,Có,Có,Không,Có,Must Have
phone unique constraint,Có,Có,Không,Có,Nice to Have
email unique constraint,Có,Có,Không,Có,Nice to Have
Indexes cho query thường dùng,Có,Có,Không,Có,Nice to Have
Soft delete,Không,Không,Không,Không,Không phù hợp

### 2. Extend schema if required fields are missing (Must Have)

#### Đã mở rộng model Courier với đầy đủ các trường cần thiết:

model Courier {
id Int @id @default(autoincrement())
externalId String @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid

fullName String
phone String @unique
email String? @unique

vehicleType String?
vehiclePlate String?

// Approval Flow
approvalStatus ApprovalStatus @default(PENDING)
operationalStatus OperationalStatus @default(ACTIVE)
rejectionReason String?

// Audit fields
approvedBy Int?
rejectedBy Int?
approvedAt DateTime?
rejectedAt DateTime?

createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Relations
user User? @relation(fields: [userId], references: [id])
userId Int? @unique

approvedByUser User? @relation("CourierApprovedBy", fields: [approvedBy], references: [id])
rejectedByUser User? @relation("CourierRejectedBy", fields: [rejectedBy], references: [id])

@@index([approvalStatus])
@@index([operationalStatus])
@@index([phone])
@@index([email])
@@map("couriers")
}

### 3. Create Prisma migration for schema changes (Must Have)

npx prisma migrate dev --name add_full_courier_approval_flow

### 4. Update seed.ts with permissions courier:\* and role mapping (Must Have)

Đã cập nhật file prisma/seed.ts:

// ========== COURIER PERMISSIONS ==========
await prisma.permission.createMany({
data: [
{ resource: 'courier', action: 'read' },
{ resource: 'courier', action: 'create' },
{ resource: 'courier', action: 'update' },
{ resource: 'courier', action: 'update_status' },
{ resource: 'courier', action: 'approve' },
{ resource: 'courier', action: 'reject' },
],
skipDuplicates: true,
});

// ========== COURIER ROLE ==========
await prisma.role.upsert({
where: { name: 'COURIER' },
update: {},
create: {
name: 'COURIER',
description: 'Tài xế giao hàng - chỉ nhận đơn khi được Admin phê duyệt',
},
});

#### Nice to Have đã thực hiện

Thêm unique constraints cho phone và email (tránh đăng ký trùng lặp)
Thêm indexes cho các trường hay được query (approvalStatus, operationalStatus, phone, email) → cải thiện performance
Không triển khai soft delete vì:
Courier cần giữ lịch sử phê duyệt rõ ràng (approved/rejected)
Dễ gây nhầm lẫn khi gán role và phân công đơn hàng

```

```
