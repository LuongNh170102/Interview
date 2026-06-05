TASK 2 – Courier Registration Flow

1. Những gì đã làm

1.1 Phân tích schema

So sánh Courier với Agency/Merchant trước khi sửa:

- Agency/Merchant: có externalId, approval workflow (PENDING/APPROVED/REJECTED), operationalStatus, audit fields
- Courier cũ: chỉ có userId, name, phone, status (string), vehicleType - không có luồng duyệt
- Kết luận: Courier cần bổ sung approval workflow và đồng bộ pattern với Agency/Merchant để Admin duyệt trước khi nhận đơn

1.2 Database

File chính:
- prisma/schema.prisma
- prisma/migrations/20260605120000_extend_courier_approval_workflow/migration.sql
- prisma/seed.ts

Thay đổi schema:
- externalId (UUID, unique) - API dùng externalId, không lộ internal id
- email, address, latitude, longitude - thông tin đăng ký + chuẩn bị Task 3 (chọn courier gần nhất)
- approvalStatus + approvedAt/By, rejectedAt/By, rejectionReason - luồng duyệt một lần
- operationalStatus (enum) - trạng thái vận hành lâu dài
- availabilityStatus (enum ONLINE/OFFLINE/BUSY) - thay field status string cũ
- phone @unique - không trùng số khi đăng ký
- @@index trên approvalStatus, availabilityStatus

Migration backfill external_id cho row cũ và map status cũ sang availabilityStatus.

Seed thêm permissions:
- courier:create, courier:read, courier:update, courier:update_status, courier:delete
- Role COURIER: courier:read, courier:update, order:read, order:update_status
- Role ADMIN: đã có full quyền courier:*

1.3 Backend API

Module: api-service/src/app/courier/ - mirror cấu trúc agency/merchant

Luồng đăng ký:
- POST /api/couriers/otp/request - gửi OTP (public)
- POST /api/couriers/otp/verify - xác thực OTP, trả registration token
- POST /api/couriers/register - JWT required, tạo Courier PENDING, gán role COURIER

API quản trị:
- GET /api/couriers - list + filter (approvalStatus, search) + statistics
- GET /api/couriers/:id - chi tiết theo externalId
- PATCH /api/couriers/:id/approve - duyệt, gán role nếu chưa có (idempotent)
- PATCH /api/couriers/:id/reject - từ chối, bắt buộc rejectionReason
- PATCH /api/couriers/:id - courier tự cập nhật profile

Authorization:
- courier:read - list/detail
- courier:update_status - approve/reject
- courier:update - self-update
- JwtAuthGuard + PermissionsGuard trên toàn bộ endpoint quản trị

Unit test backend: api-service/src/app/courier/courier.service.spec.ts - 6 test cases (approve, reject, idempotent approve, validation)

1.4 Frontend Management

Trang: front-management/src/app/pages/users/couriers/

Route: /users/couriers - guard courier:read

Tính năng:
- Danh sách courier PENDING mặc định
- Approve trực tiếp từ bảng (confirm modal)
- Reject qua modal nhập lý do (min 5 ký tự)
- Pagination, search, statistic cards (pending/approved/active)
- Toast success/error qua GlobalModalService
- Optimistic UI: xóa row ngay khi approve/reject, rollback nếu API lỗi

Shared:
- shared/src/lib/services/courier.service.ts
- shared/src/lib/interfaces/courier.interface.ts

i18n: admin.users.couriers.* trong vi.json, en.json, ko.json

Unit test frontend: couriers.component.spec.ts - 4 test pass
- load pending on init
- approve from table
- reject with reason
- restore list on reject error

2. Lý do kỹ thuật

2.1 Tại sao mirror Agency/Merchant?

- Codebase đã có pattern approval workflow hoàn chỉnh ở Agency/Merchant
- Copy pattern giảm rủi ro, reviewer dễ đọc, permission naming nhất quán (resource:action)
- externalId trong API - không expose auto-increment id, an toàn hơn khi public endpoint

2.2 Tách approvalStatus vs operationalStatus vs availabilityStatus

- approvalStatus: một lần khi đăng ký (PENDING => APPROVED/REJECTED)
- operationalStatus: Admin có thể suspend/lock courier sau này
- availabilityStatus: real-time ONLINE/OFFLINE/BUSY cho Task 3 gán đơn
- Ba layer tách biệt tránh nhầm "đã duyệt" với "đang online"

2.3 OTP flow giống Agency

- Courier chưa có account => OTP verify phone trước khi register
- Registration token ngắn hạn sau verify OTP, register endpoint cần JWT
- Tránh tạo courier record khi chưa xác thực số điện thoại

2.4 Approve idempotent

- Gọi approve lần 2 trên courier đã APPROVED => trả về record hiện tại, không throw error
- Tránh lỗi khi Admin double-click hoặc retry network

2.5 Frontend optimistic update

- UX phản hồi ngay khi Admin duyệt/từ chối
- Rollback + toast error nếu API fail - không mất dữ liệu thật

3. Bảo mật & ổn định

- Mọi endpoint quản trị có JwtAuthGuard + PermissionsGuard
- Reject bắt buộc rejectionReason (DTO validation + min length)
- phone @unique - chặn đăng ký trùng số
- Chỉ courier APPROVED mới eligible nhận đơn (chuẩn bị Task 3)
- Không log sensitive data trong courier module

4. Test & verify thủ công

Chạy local:
- docker compose up -d postgres minio createbuckets
- npx prisma generate && npx prisma migrate deploy && npx prisma db seed
- npx nx serve api-service (port 3000)
- npx nx serve front-management --port=4300

Test backend:
- npx nx test api-service --testPathPattern=courier.service.spec

Test frontend:
- npx nx test front-management --testFile=src/app/pages/users/couriers/couriers.component.spec.ts

Luồng thủ công:
- Đăng nhập admin: admin@vhandelivery.com / admin123
- Mở http://localhost:4300/users/couriers
- Đăng ký courier qua API (OTP => verify => register)
- Approve/Reject trên UI, kiểm tra toast và list refresh

5. Bổ sung sau review (Must Have + Nice-to-have)

- `DELETE /api/couriers/:id` - soft delete, permission `courier:delete`
- `RejectCourierDto` - `@MinLength(5)` đồng bộ với frontend
- Soft delete - `couriers.deleted_at`, exclude khỏi list/order assignment
- Email `@unique` trên schema + check khi register
- OTP rate limiting - 3 request/15 phút, tối đa 5 lần verify sai (`otp.service.ts` + `failed_attempts`)
- OTP unit tests - `otp.service.spec.ts` (6 tests: rate limit, expiration, attempts)
- Audit logging - bảng `courier_approval_audits`, ghi APPROVE/REJECT/DELETE
- Filter ngày đăng ký - `startDate`/`endDate` query + date inputs trên UI couriers
- Unit tests frontend - approve rollback, pagination, date filter (`couriers.component.spec.ts` => 8 tests)
