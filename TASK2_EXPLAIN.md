# TASK 2 - Luồng Đăng Ký Courier

## Tôi Đã Làm Gì

Đã triển khai các yêu cầu bắt buộc của luồng đăng ký Courier trên database, backend API, permission seed, Management UI và unit test.

## Thiết Kế Database

Đã cập nhật `prisma/schema.prisma`:

- Thêm `externalId` cho Courier để dùng làm public API identifier.
- Thêm `email`.
- Thêm các field quản lý quy trình xét duyệt:
  - `approvalStatus`
  - `approvedAt`
  - `approvedBy`
  - `rejectedAt`
  - `rejectedBy`
  - `rejectionReason`
- Thêm các field trạng thái vận hành:
  - `operationalStatus`
  - `statusChangedAt`
  - `statusChangedBy`
  - `statusReason`
- Thêm index cho approval status, operational status và availability status.

Đã tạo migration:

- `prisma/migrations/202606032355_extend_courier_approval/migration.sql`

Đã cập nhật `prisma/seed.ts`:

- Thêm `courier:create`
- Thêm `courier:read`
- Thêm `courier:update`
- Thêm `courier:delete`
- Thêm `courier:update_status`
- Map role `COURIER` với các permission courier/order phù hợp.

## Backend API

Đã thêm Courier module:

- `api-service/src/app/courier/courier.module.ts`
- `api-service/src/app/courier/courier.controller.ts`
- `api-service/src/app/courier/courier.service.ts`

Đã thêm DTO:

- `CreateCourierDto`
- `UpdateCourierDto`
- `RejectCourierDto`
- `CourierQueryDto`

Đã thêm Entity và QueryBuilder:

- `CourierEntity`
- `CourierQueryBuilder`

Các endpoint đã triển khai:

- `POST /api/couriers/otp/request`
- `POST /api/couriers/otp/verify`
- `POST /api/couriers/register`
- `GET /api/couriers`
- `GET /api/couriers/:id`
- `PATCH /api/couriers/:id`
- `PATCH /api/couriers/:id/approve`
- `PATCH /api/couriers/:id/reject`
- `DELETE /api/couriers/:id`

Business rules đã triển khai:

- Courier tự đăng ký phải có OTP verification token hợp lệ.
- Courier mới luôn được lưu ở trạng thái `PENDING`.
- Admin approve sẽ chuyển Courier thành `APPROVED`.
- Admin reject bắt buộc nhập `rejectionReason`.
- Chỉ khi được approve, user mới được gán role `COURIER`.
- Gọi approve nhiều lần không tạo role trùng lặp.

## Frontend Management

Đã thêm trang duyệt Courier đang chờ:

- `front-management/src/app/pages/users/couriers/couriers.component.ts`
- `front-management/src/app/pages/users/couriers/couriers.component.html`
- `front-management/src/app/pages/users/couriers/couriers.component.scss`

Đã cập nhật route:

- `/users/couriers`

Chức năng UI:

- Hiển thị danh sách courier `PENDING`.
- Hỗ trợ tìm kiếm và pagination.
- Admin approve trực tiếp từ danh sách.
- Admin reject qua modal và bắt buộc nhập lý do.
- Hiển thị modal thông báo thành công hoặc lỗi.

Đã cập nhật shared library:

- Thêm Courier interfaces.
- Thêm `CourierService` để gọi backend API.

## Tuân Thủ Pattern Của Hệ Thống

Backend làm theo pattern hiện có của Agency và Merchant:

- Tách Module / Controller / Service.
- Dùng DTO validation thông qua global `ValidationPipe`.
- Dùng Entity để định hình API response.
- Dùng QueryBuilder để filter danh sách.
- Dùng PrismaService cho persistence.
- Dùng `PermissionsGuard` và `@Permissions()` cho admin APIs.

Frontend làm theo convention hiện có của Management app:

- Angular standalone component.
- Quản lý state bằng signal.
- Dùng shared API service từ `@vhandelivery/shared-ui`.
- Dùng global modal service cho thông báo.
- Route được lazy load.

## Kiểm Tra Và Xác Minh

Backend unit tests:

```text
npm.cmd run test:api-service -- --runInBand
```

Kết quả:

- 3 test files pass.
- 5 tests pass.
- Có unit test riêng cho Courier approval flow.

Backend build:

```text
npx.cmd nx build api-service
```

Kết quả: pass.

Frontend Management build:

```text
npx.cmd nx build front-management
```

Kết quả: pass.

Frontend Management tests:

```text
npx.cmd nx test front-management --runInBand
```

Kết quả:

- 2 test files pass.
- 4 tests pass.
- Có component tests cho trang quản lý Courier.

## Giải Thích Quyết Định Kỹ Thuật

### Vì Sao Courier Cần Approval Fields Riêng

Agency và Merchant đã tách trạng thái xét duyệt đăng ký khỏi trạng thái vận hành. Courier cũng cần cách tách tương tự:

- `PENDING / APPROVED / REJECTED`: trạng thái xét duyệt đăng ký.
- `ONLINE / BUSY / OFFLINE`: trạng thái sẵn sàng nhận đơn.
- `ACTIVE / INACTIVE / SUSPENDED / LOCKED`: trạng thái vận hành lâu dài.

Nếu gộp chung các trạng thái này, hệ thống khó xác định Courier đã được duyệt hay chỉ đang offline.

### Vì Sao Chỉ Gán Role Sau Khi Approve

Courier chưa được xét duyệt không được có permission vận hành. Việc chỉ gán role `COURIER` sau khi Admin approve đảm bảo Courier `PENDING` không thể nhận hoặc xử lý đơn giao hàng.

### Vì Sao Reject Phải Có Lý Do

Đây là yêu cầu bắt buộc của đề. Ngoài ra, lý do từ chối giúp Admin/support giải thích Courier cần bổ sung hoặc sửa thông tin gì trước khi đăng ký lại.

### Vì Sao Frontend Chỉ Tập Trung Vào Approval Flow

Ưu tiên đầu tiên là hoàn thành đúng luồng bắt buộc: xem danh sách pending, approve và reject có lý do. Các tính năng cộng điểm như filter nâng cao và optimistic update có thể làm sau khi business flow cốt lõi ổn định.

## Cải Tiến Tiếp Theo

Các phần sau chưa nằm trong phạm vi triển khai chính, nhưng có thể bổ sung để tăng độ sẵn sàng production:

- OTP rate limiting.
- Audit log riêng cho hành động approve/reject.
- Filter theo ngày đăng ký.
- Optimistic UI updates.
- Soft delete.
- Unique constraint cho Courier phone/email nếu business rule yêu cầu một Courier duy nhất theo phone/email.
