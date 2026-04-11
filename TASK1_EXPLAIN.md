# TASK 1 – Code Review Report

## Danh sách các Issues đã phát hiện

| STT | Severity     | File Path & Line                                                                                                                                                                      | Mô tả Issue                                                                                | Tác động thực tế (Real-world Impact)                                                                                                                          |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Critical** | `api-service/src/app/otp/otp.service.ts:24`                                                                                                                                           | In ra OTP code bằng `console.log` ở mọi môi trường                                         | OTP bị lộ trong log production. Ai có quyền xem log (dev, ops, attacker qua breach log) đều có thể ăn cắp OTP → chiếm đoạt tài khoản merchant/agency.         |
| 2   | **Critical** | `api-service/src/app/auth/guards/google-auth.guard.ts:68-80`<br>`api-service/src/app/auth/guards/kakao-auth.guard.ts:68-80`<br>`api-service/src/app/auth/auth.controller.ts:128, 200` | Xây dựng OAuth callback URL từ `req.get('host')` (Host header) mà không kiểm soát chặt chẽ | **Host Header Injection + Open Redirect**. Attacker có thể dẫn hướng callback về domain độc hại, đánh cắp `access_token` và `refresh_token` qua query string. |
| 3   | **Major**    | `api-service/src/app/merchant/merchant.service.ts:312-355` (updateStatus)<br>`api-service/src/app/merchant/merchant.service.ts:478-500` (adminCreate)                                 | Logic gán role `MERCHANT_OWNER` không đồng nhất giữa self-registration và admin-create     | Merchant tự đăng ký thành công nhưng không có quyền truy cập merchant dashboard (vẫn chỉ là CUSTOMER role). Gây lỗi permission ngay sau khi đăng ký.          |
| 4   | **Major**    | `api-service/src/app/prisma.service.ts:22-31`                                                                                                                                         | Chạy `execSync('npx prisma migrate deploy')` trên **mọi lần khởi động** ứng dụng           | Làm chậm cold start, có nguy cơ crash pod khi migrate fail, và gây xung đột ở môi trường multi-instance (Kubernetes, Docker Swarm).                           |
| 5   | **Minor**    | `api-service/src/app/common/utils/localization.util.ts`<br>`api-service/src/app/category/category.service.ts:19`<br>`api-service/src/app/product/product.service.ts:68`               | Không sanitize dữ liệu localized (name, description) trước khi lưu JSON                    | **Stored XSS**. Merchant có thể chèn `<script>alert(1)</script>` vào tên sản phẩm/danh mục → ảnh hưởng đến toàn bộ khách hàng khi frontend render.            |
| 6   | **Minor**    | `api-service/src/app/auth/strategies/kakao.strategy.ts:45`                                                                                                                            | Fallback email cho Kakao là domain giả (`kakao_${id}@vhandelivery.com`)                    | Dễ gây xung đột email, khó khôi phục tài khoản, và làm hỏng flow liên kết tài khoản (account linking).                                                        |

## Top 3 Issues Quan Trọng Nhất & Lý Do

### 1. Critical – OTP bị in ra console (OTP Leakage)

- **Lý do quan trọng nhất**: Đây là lỗ hổng bảo mật rõ ràng và dễ khai thác nhất.
- **Tác động**: Toàn bộ quy trình đăng ký Merchant & Agency bị vô hiệu hóa về mặt bảo mật. Một người xem log là có thể chiếm tài khoản.

### 2. Critical – Host Header Injection trong Google & Kakao OAuth

- **Lý do quan trọng**: OAuth là điểm vào quan trọng nhất của hệ thống. Token được trả về qua URL query string → cực kỳ dễ bị đánh cắp nếu redirect bị kiểm soát.
- **Tác động**: Attacker có thể chiếm session người dùng mà không cần biết mật khẩu.

### 3. Major – Logic gán role MERCHANT_OWNER không đồng nhất

- **Lý do quan trọng**: Ảnh hưởng trực tiếp đến trải nghiệm người dùng B2B (merchant).
- **Tác động**: Merchant đăng ký xong nhưng không dùng được chức năng → nhiều ticket support, mất lòng tin, và làm chậm quá trình onboarding.

## Hướng khắc phục cụ thể cho từng Issue

**Issue 1 (OTP Leak):**

// Thay vì console.log
if (process.env.NODE_ENV !== 'production') {
this.logger.debug(`[OTP] Phone: ${dto.phone}, Code: ${code}`);
}

**Issue 2 (Host Header Injection):**

Thêm app.enable('trust proxy'); trong main.ts
Tạo danh sách ALLOWED_FRONTEND_HOSTS từ environment variable
Validate nghiêm ngặt Host header trước khi xây dựng callback URL
Đăng ký tất cả callback URLs hợp lệ trong Google/Kakao Console

**Issue 3 (Merchant Role):**

Tách hàm assignMerchantOwnerRole(userId, merchantId, tx) dùng chung cho cả 2 flow
Gọi hàm này trong create() (self-registration) và adminCreate()

**Issue 4 (Prisma Migration):**

Xóa execSync khỏi PrismaService
Chạy migration trong Dockerfile hoặc CI/CD pipeline riêng:dockerfile CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

**Issue 5 (Stored XSS):**

Sử dụng thư viện sanitize-html hoặc xss
Sanitize trước khi gọi toLocalizedJson()

**Issue 6 (Kakao Email Fallback):**

Yêu cầu email bắt buộc từ Kakao hoặc xử lý graceful fallback (tạo email tạm + thông báo người dùng cập nhật sau)

## Các vấn đề khác đáng chú ý (Nice to Have)

Cross-layer dependency: API giả định frontend luôn có route /login và xử lý được các query param (access_token, requiresLinking). Nên có tài liệu rõ ràng hoặc contract giữa BE-FE.
Security: Chưa có rate limiting cho /auth/login, /otp/request, OAuth endpoints → dễ bị brute force & OTP bombing.
Exploit scenario cho Issue 2: Attacker gửi request với Host: attacker.com → Google callback về domain độc hại → token bị đánh cắp qua query string.

## Đề xuất phòng ngừa tái phát

Thêm custom ESLint rule: no-console-in-production
Sử dụng eslint-plugin-security
Thêm bước kiểm tra Prisma migration trong CI/CD
Bắt buộc review code cho tất cả thay đổi liên quan đến authentication & authorization

## Kế hoạch khắc phục trong 1 tuần (1-Week Sprint Plan)

**Tuần 1:** Security & Stability Hardening

**Ngày 1:** Fix OTP logging + chuyển sang Logger
**Ngày 2:** Sửa Host Header Injection + thêm allow-list
**Ngày 3:** Đồng nhất logic gán role MERCHANT_OWNER
**Ngày 4:** Loại bỏ execSync Prisma + cập nhật deployment
**Ngày 5:** Thêm input sanitization chống Stored XSS
**Ngày 6:** Thêm rate limiting cho các endpoint nhạy cảm
**Ngày 7:** Viết test, cập nhật documentation, chạy regression test

Mục tiêu cuối tuần: Tất cả 6 issues được khắc phục, codebase an toàn và ổn định hơn rõ rệt.
