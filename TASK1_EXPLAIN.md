# TASK 1 - Review Code Và Phân Tích Vấn Đề Nghiêm Trọng

## 1. Phạm Vi Và Phương Pháp Review

Tôi review luồng xử lý xuyên suốt monorepo Nx, gồm:

- Backend NestJS trong `api-service`.
- Frontend Angular trong `front-management`, `front-b2b` và thư viện `shared`.
- Prisma, cấu hình môi trường và dữ liệu.
- Luồng xác thực, phân quyền, upload file và product API.

Mỗi vấn đề bên dưới được đánh giá theo mức độ `Critical`, `Major` hoặc `Minor`; kèm file, dòng chính xác, ảnh hưởng thực tế và hướng sửa cụ thể.

## 2. Tổng Hợp Các Vấn Đề Đã Phát Hiện

| STT | Mức độ   | Vấn đề                                                           | File và dòng chính                                                                                                                                                                            |
| --- | -------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Critical | File môi trường chứa secret đang được Git theo dõi               | `.env.development:11,14,16,26,27,34,38`; `api-service/src/app/app.module.ts:21-24`                                                                                                            |
| 2   | Critical | OAuth access token được truyền qua URL                           | `api-service/src/app/auth/auth.controller.ts:203-207,341-345`; `front-b2b/src/app/pages/auth/login/login.component.ts:74-80`; `front-management/src/app/pages/login/login.component.ts:74-80` |
| 3   | Critical | File upload được công khai nhưng thiếu kiểm tra nội dung an toàn | `api-service/src/app/common/services/storage.service.ts:34,43-44,59`                                                                                                                          |
| 4   | Major    | Quyền tạo product rộng hơn yêu cầu `MERCHANT_OWNER`              | `api-service/src/app/product/product.controller.ts:33-43`; `api-service/src/app/common/pipes/merchant-ownership.pipe.ts:92-108`                                                               |
| 5   | Major    | API danh sách product không phân trang và trả dư dữ liệu         | `api-service/src/app/product/product.controller.ts:46-48`; `api-service/src/app/product/product.service.ts:73-78`                                                                             |

Tổng cộng: **5 vấn đề**, gồm **3 Critical** và **2 Major**.

## 3. Phân Tích Chi Tiết Từng Vấn Đề

### 3.1. File Môi Trường Chứa Secret Đang Được Git Theo Dõi

- **Mức độ:** Critical
- **Layer ảnh hưởng:** Cấu hình, backend, database, cloud storage, OAuth.
- **File và dòng chính xác:**
  - `.env.development:11` - `DATABASE_URL`
  - `.env.development:14` - `JWT_SECRET`
  - `.env.development:16` - `JWT_REFRESH_SECRET`
  - `.env.development:26-27` - AWS credentials
  - `.env.development:34,38` - OAuth client secrets
  - `api-service/src/app/app.module.ts:21-24` - ứng dụng đọc `.env.development` ngoài production

**Mô tả vấn đề**

Git đang theo dõi `.env`, `.env.development` và `.env.example`. File development có các biến bí mật dùng cho database, JWT, AWS và OAuth. Secret đã commit phải được coi là đã bị lộ, kể cả khi repository hiện tại là private.

**Ảnh hưởng thực tế tới người dùng**

- Kẻ tấn công có thể giả mạo JWT để truy cập tài khoản người dùng.
- Database có thể bị đọc, sửa hoặc xóa nếu URL kết nối còn hiệu lực.
- File trên cloud storage có thể bị truy cập hoặc thay đổi.
- Đăng nhập Google/Kakao có thể bị ảnh hưởng nếu OAuth secret bị lạm dụng.

**Kịch bản khai thác**

1. Một tài khoản có quyền đọc repo bị xâm nhập hoặc một bản sao repo bị chia sẻ.
2. Kẻ tấn công lấy secret từ lịch sử Git.
3. Kẻ tấn công dùng JWT secret để ký token giả hoặc dùng thông tin kết nối để truy cập hạ tầng.
4. Người dùng bị chiếm quyền tài khoản hoặc dữ liệu bị lộ.

**Hướng sửa cụ thể**

- Xóa `.env` và `.env.development` khỏi Git history.
- Rotate toàn bộ secret từng xuất hiện trong repository.
- Chỉ giữ `.env.example` với giá trị placeholder.
- Lưu secret bằng GitHub Actions Secrets, Vault hoặc secret manager của nền tảng triển khai.

**Cách ngăn lỗi tái diễn**

- Chạy Gitleaks hoặc TruffleHog trong pre-commit và CI.
- Thêm quy tắc chặn `.env*`, ngoại trừ `.env.example`.

### 3.2. OAuth Access Token Được Truyền Qua URL

- **Mức độ:** Critical
- **Layer ảnh hưởng:** Backend auth, frontend login, shared auth service, API.
- **File và dòng chính xác:**
  - `api-service/src/app/auth/auth.controller.ts:203-207` - Google callback
  - `api-service/src/app/auth/auth.controller.ts:341-345` - Kakao callback
  - `front-b2b/src/app/pages/auth/login/login.component.ts:74-80`
  - `front-management/src/app/pages/login/login.component.ts:74-80`
  - `shared/src/lib/services/auth.service.ts:205-213`
  - `shared/src/lib/interceptors/auth.interceptor.ts:13-17`

**Mô tả vấn đề**

Sau khi OAuth thành công, backend redirect về frontend với access token nằm trong query string. Frontend đọc token từ URL, lưu token và dùng token đó làm Bearer token cho API.

**Ảnh hưởng thực tế tới người dùng**

- Token có thể xuất hiện trong browser history, reverse proxy log, analytics, ảnh chụp màn hình hoặc `Referer`.
- Người lấy được token có thể gọi API dưới danh nghĩa nạn nhân cho đến khi token hết hạn.

**Kịch bản khai thác**

1. Người dùng đăng nhập bằng Google hoặc Kakao.
2. Backend redirect tới URL có `access_token`.
3. Browser extension, hệ thống log hoặc bên thứ ba ghi lại URL.
4. Kẻ tấn công lấy token và gọi API được bảo vệ.

**Hướng sửa cụ thể**

- Không đưa access token vào URL.
- Redirect bằng one-time authorization code có thời hạn rất ngắn.
- Frontend đổi code lấy session qua một POST request.
- Lưu refresh token trong cookie `HttpOnly`, `Secure`, `SameSite`.
- Có thể dùng Authorization Code Flow với PKCE nếu phù hợp kiến trúc.

**Cách ngăn lỗi tái diễn**

- Thêm integration test xác nhận URL redirect không chứa token.
- Thêm rule review chặn các query parameter tên `token`, `access_token`, `refresh_token`.

### 3.3. File Upload Công Khai Nhưng Thiếu Kiểm Tra Nội Dung An Toàn

- **Mức độ:** Critical
- **Layer ảnh hưởng:** Backend, AWS S3, dữ liệu người dùng.
- **File và dòng chính xác:** `api-service/src/app/common/services/storage.service.ts:34,43-44,59`

**Mô tả vấn đề**

Extension lấy từ `originalname`, MIME type lấy trực tiếp từ client và file được upload với ACL `public-read`. Hệ thống không chứng minh nội dung file thực sự đúng loại đã khai báo.

**Ảnh hưởng thực tế tới người dùng**

- Tài liệu hoặc hình ảnh riêng tư có thể bị công khai.
- Kẻ xấu có thể dùng hệ thống làm nơi phát tán file nguy hiểm.
- File HTML/SVG có nội dung độc hại có thể gây rủi ro khi người dùng mở URL.

**Kịch bản khai thác**

1. Kẻ tấn công đổi tên file nguy hiểm thành đuôi ảnh và giả MIME type.
2. Backend tin dữ liệu client và upload file dưới quyền `public-read`.
3. Kẻ tấn công gửi URL công khai cho nạn nhân.
4. Nạn nhân tải hoặc mở nội dung nguy hiểm.

**Hướng sửa cụ thể**

- Mặc định lưu file private.
- Kiểm tra magic bytes thay vì chỉ tin extension và MIME type.
- Allowlist loại file cần thiết, ví dụ JPEG, PNG và WebP.
- Giới hạn kích thước, đổi tên file phía server và dùng signed URL.
- Quét malware cho file upload trong môi trường production.

**Cách ngăn lỗi tái diễn**

- Thêm test cho MIME mismatch, file vượt kích thước và loại file không hỗ trợ.
- Chặn cấu hình `public-read` qua policy hoặc review rule.

### 3.4. Quyền Tạo Product Rộng Hơn Yêu Cầu `MERCHANT_OWNER`

- **Mức độ:** Major
- **Layer ảnh hưởng:** Backend authorization, product API, dữ liệu merchant.
- **File và dòng chính xác:**
  - `api-service/src/app/product/product.controller.ts:33-43`
  - `api-service/src/app/common/pipes/merchant-ownership.pipe.ts:92-108`

**Mô tả vấn đề**

Pipe kiểm tra role `MERCHANT_OWNER` tại dòng 92-96, nhưng dòng 107-108 tiếp tục cho phép agency owner thao tác. Điều này làm phạm vi quyền tạo product rộng hơn yêu cầu của task.

**Ảnh hưởng thực tế tới người dùng**

- Agency owner có thể tạo product cho merchant dù không phải merchant owner.
- Product có thể được tạo sai chủ sở hữu, gây tranh chấp và sai audit trail.

**Hướng sửa cụ thể**

- Bắt buộc user có role `MERCHANT_OWNER` và sở hữu đúng merchant khi tạo product.
- Nếu nghiệp vụ cho phép agency quản lý product, tạo permission riêng có tên rõ ràng.
- Thêm test từ chối user khác merchant và agency owner không có permission riêng.

**Cách ngăn lỗi tái diễn**

- Thêm ma trận authorization test theo role và ownership.
- Không gộp nhiều quy tắc sở hữu khác nhau trong một pipe dùng chung.

### 3.5. API Danh Sách Product Không Phân Trang Và Trả Dư Dữ Liệu

- **Mức độ:** Major
- **Layer ảnh hưởng:** Product API, Prisma, frontend B2C.
- **File và dòng chính xác:**
  - `api-service/src/app/product/product.controller.ts:46-48`
  - `api-service/src/app/product/product.service.ts:73-78`

**Mô tả vấn đề**

Endpoint `findAll()` gọi `findMany()` không có pagination, không lọc trạng thái product và include toàn bộ merchant.

**Ảnh hưởng thực tế tới người dùng**

- Khi số lượng product tăng, response lớn làm API và giao diện chậm hoặc timeout.
- Product inactive có thể xuất hiện trên storefront.
- Dữ liệu merchant không cần thiết có thể bị trả ra ngoài.

**Hướng sửa cụ thể**

- Bắt buộc `page` và `limit`, đặt giới hạn tối đa cho `limit`.
- Chỉ trả product active/published cho API public.
- Dùng `select` để chỉ trả các field storefront cần.
- Thêm index phù hợp cho `merchantId`, trạng thái và điều kiện sắp xếp.

**Cách ngăn lỗi tái diễn**

- Thêm API contract test cho pagination, status filtering và response fields.
- Thêm quy ước mọi list endpoint phải có pagination.

## 4. Top 3 Vấn Đề Nghiêm Trọng Nhất

| Hạng | Vấn đề                                              | Lý do ưu tiên                                                                                                    |
| ---- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1    | Secret trong file môi trường đang được Git theo dõi | Có thể dẫn trực tiếp tới giả mạo tài khoản, truy cập database và cloud storage. Phạm vi ảnh hưởng toàn hệ thống. |
| 2    | OAuth access token được truyền qua URL              | Chỉ cần URL bị ghi log hoặc lộ là attacker có thể dùng token để gọi API dưới danh nghĩa người dùng.              |
| 3    | Upload file công khai và thiếu kiểm tra nội dung    | Có thể làm lộ dữ liệu người dùng và biến hệ thống thành nơi phát tán nội dung nguy hiểm.                         |

Ba vấn đề này được xếp cao nhất vì có đường khai thác thực tế, ảnh hưởng trực tiếp tới bảo mật người dùng và hạ tầng, đồng thời phạm vi thiệt hại lớn hơn các vấn đề hiệu năng hoặc vận hành.

## 5. Các Vấn Đề Xuyên Nhiều Layer

| Vấn đề                | Frontend                                            | Shared/API client                                    | Backend/API                                         | Hạ tầng hoặc dữ liệu                                     |
| --------------------- | --------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| OAuth token trong URL | Login page đọc token từ query string                | Auth service lưu token, interceptor gắn Bearer token | Auth controller đưa token vào redirect URL          | Proxy log, browser history và analytics có thể lưu token |
| Product authorization | UI có thể hiển thị thao tác tạo product             | Request gửi merchant ID                              | Pipe quyết định ownership và controller tạo product | Product có thể gắn sai chủ sở hữu trong database         |
| Product listing       | Storefront nhận danh sách lớn hoặc product inactive | Client phải xử lý response dư dữ liệu                | Endpoint không pagination, không lọc status         | Prisma đọc nhiều bản ghi và field hơn cần thiết          |
| Upload file           | Người dùng mở URL file                              | API client gửi file và metadata                      | Storage service tin MIME/extension từ client        | S3 lưu file dưới quyền public                            |

## 6. Đề Xuất CI/CD Và Lint Rule Ngăn Lỗi Tái Diễn

| Kiểm tra              | Cách áp dụng                                          | Lỗi được ngăn                                      |
| --------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| Secret scanning       | Chạy Gitleaks/TruffleHog trên commit và Pull Request  | Secret bị commit vào Git                           |
| Authorization tests   | Chạy integration test theo role và ownership          | User sai quyền thao tác tài nguyên                 |
| API contract tests    | Kiểm tra pagination, status filter và response fields | List API trả dư dữ liệu hoặc không giới hạn        |
| Upload security tests | Kiểm tra MIME mismatch, magic bytes, file size và ACL | Upload file giả loại hoặc file public ngoài ý muốn |
| OAuth redirect test   | Xác nhận redirect URL không chứa token                | Token quay lại query string                        |

## 7. Kế Hoạch Sprint Một Tuần

| Ngày   | Mục tiêu                      | Công việc chính                                                                      | Kết quả mong đợi                                        |
| ------ | ----------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Ngày 1 | Xử lý secret                  | Xóa env khỏi Git history, rotate secret, cấu hình secret manager và secret scan      | Secret cũ vô hiệu; CI chặn secret mới                   |
| Ngày 2 | Sửa OAuth                     | Thay token trong URL bằng one-time code/PKCE, thêm integration test                  | Redirect URL không còn chứa access token                |
| Ngày 3 | Bảo vệ upload                 | Chuyển file sang private, validate magic bytes, giới hạn dung lượng, dùng signed URL | File giả loại bị từ chối; file không tự public          |
| Ngày 4 | Siết authorization            | Tách rõ quyền merchant owner và agency, bổ sung ma trận test                         | Chỉ đúng role và owner được tạo product                 |
| Ngày 5 | Sửa product listing           | Thêm pagination, status filtering, field selection và test                           | API ổn định khi dữ liệu lớn, không trả product inactive |
| Ngày 6 | Kiểm thử hồi quy              | Chạy unit test, integration test và kiểm tra các luồng đăng nhập, upload, product    | Năm bản sửa không làm hỏng chức năng hiện tại           |
| Ngày 7 | Review và chuẩn bị triển khai | Review bảo mật, kiểm tra CI, hoàn thiện tài liệu và kế hoạch rollback                | Thay đổi sẵn sàng tạo Pull Request và triển khai        |

## 8. Kết Luận

Codebase có kiến trúc phân lớp rõ, nhưng đang tồn tại các rủi ro quan trọng tại ranh giới giữa cấu hình, xác thực, phân quyền, upload và product API. Ưu tiên đầu tiên phải là vô hiệu hóa secret đã commit, loại access token khỏi URL và bảo vệ upload. Sau đó cần siết authorization và sửa product listing để bảo vệ dữ liệu, hiệu năng và trải nghiệm người dùng.
