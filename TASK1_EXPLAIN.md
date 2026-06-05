TASK 1 - Code Review & Phân Tích Các Vấn Đề Nghiêm Trọng

1. Phạm vi review

Tôi review toàn bộ source code gốc trên nhánh `main`, tập trung vào các phần dễ gây lỗi khi lên production:

- Backend: Auth, JWT, OAuth, OTP, Product/Merchant/Agency API, Prisma schema, Guards, Docker
- Frontend: front-management, front-b2b, front-b2c, AuthService, interceptor, route guard
- Cross-layer: OAuth redirect, phân quyền API & UI, luồng hiển thị sản phẩm
- Infrastructure: docker-compose.yml, seed.ts, .env.example, CI/CD

Ưu tiên các luồng: đăng nhập, phân quyền, API public, OTP và lưu trữ file.

2. Các vấn đề phát hiện (7 issues)

---

Issue #1 - OAuth access token bị đưa lên URL
Severity: Critical

File & line number:
- `api-service/src/app/auth/auth.controller.ts` - lines 200-207 (Google callback redirect kèm `access_token`)
- `api-service/src/app/auth/auth.controller.ts` - lines 339-345 (Kakao callback redirect kèm `access_token`)
- `front-management/src/app/pages/login/login.component.ts` - lines 74-82 (đọc `access_token` từ query params)
- `front-b2b/src/app/pages/auth/login/login.component.ts` - lines 74-82 (đọc `access_token` từ query params)

Sau OAuth Google/Kakao thành công, backend redirect về frontend kèm `access_token`, `user`, `permissions` trong query string. Token không nên nằm trên URL vì có thể lộ qua browser history, server log, CDN/proxy log hoặc Referer header.

Ảnh hưởng:
- Token còn trong history trên máy dùng chung
- Người xem log server/proxy có thể lấy token
- Admin bị chiếm session => toàn quyền hệ thống

Hướng xử lý:
- Không truyền JWT qua URL
- Redirect về frontend với code ngắn hạn, frontend gọi `POST /api/auth/oauth/exchange` để đổi token
- Lưu code tạm Redis, xóa sau khi dùng; hoặc set token vào httpOnly cookie

Trạng thái: Đã fix - redirect chỉ trả `oauth_code`; `POST /api/auth/oauth/exchange` trả token + profile.

---

Issue #2 - Open redirect do tin Host Header
Severity: Critical

File & line number:
- `api-service/src/app/auth/auth.controller.ts` - lines 50-59 (`getFrontendUrlFromHost` build URL từ `Host` + `X-Forwarded-Proto`)
- `api-service/src/app/auth/auth.controller.ts` - lines 175, 207, 312, 345 (dùng `frontendUrl` để redirect)
- `api-service/src/app/auth/guards/google-auth.guard.ts` - lines 22-40, 55-59 (`getOriginFromHost`, `callbackURL` động)
- `api-service/src/app/auth/guards/kakao-auth.guard.ts` - lines 22-40, 55-59 (cùng pattern)

Redirect URL được build từ `Host` và `X-Forwarded-Proto` mà chưa validate allowlist. Attacker có thể giả mạo header này khi proxy không strip header lạ.

Ảnh hưởng:
- OAuth callback bị điều hướng về domain không hợp lệ
- Kết hợp Issue #1 => token bị gửi về domain attacker
- Ảnh hưởng trực tiếp luồng đăng nhập

Hướng xử lý:
- Không dùng raw `Host` để build redirect
- Allowlist domain: `FRONTEND_URL`, `B2B_FRONTEND_URL`, `MANAGEMENT_FRONTEND_URL`
- Reject nếu host không nằm trong allowlist
- Thêm test đảm bảo redirect chỉ về domain hợp lệ

Trạng thái: Đã fix - `resolveAllowedFrontendUrl()` allowlist từ env (`FRONTEND_URL`, `B2B_FRONTEND_URL`, `MANAGEMENT_FRONTEND_URL`, `B2C_FRONTEND_URL`, localhost ports).

---

Issue #3 - API product public toàn bộ dữ liệu
Severity: Critical

File & line number (codebase gốc `main`):
- `api-service/src/app/product/product.controller.ts` - lines 46-48 (`@Get()` không có guard)
- `api-service/src/app/product/product.controller.ts` - lines 51-57 (`@Get('merchant/:merchantId')` không có guard)
- `api-service/src/app/product/product.controller.ts` - lines 59-61 (`@Get(':id')` không có guard)
- `api-service/src/app/product/product.service.ts` - lines 73-78 (`findAll()` trả toàn bộ, không lọc `isActive`)
- `api-service/src/app/product/product.service.ts` - lines 120-130 (`findOne()` include `merchant`, không lọc approval status)

`GET /api/products`, `GET /api/products/:id`, `GET /api/products/merchant/:id` không có auth guard, trả về toàn bộ sản phẩm kèm merchant, không lọc active/approved.

Ảnh hưởng:
- Scrape toàn bộ catalog, giá, SKU, metadata merchant
- Sản phẩm merchant chưa duyệt vẫn có thể lộ
- B2C không nên dùng endpoint quản trị này

Hướng xử lý:
- Tách public vs management API
- `GET /api/products/public` - chỉ sản phẩm active, merchant APPROVED + ACTIVE
- `GET /api/products` - có guard, dành cho quản trị

Trạng thái: Đã fix một phần trong Task 3 - `product.controller.ts` lines 46-58 (public routes), lines 71-80 (guarded management routes); `product.service.ts` có `publicProductWhere` filter.

---

Issue #4 - OTP không rate limit, còn log mã
Severity: Major

File & line number:
- `api-service/src/app/otp/otp.service.ts` - lines 14-28 (`requestOtp`: không giới hạn tần suất gửi)
- `api-service/src/app/otp/otp.service.ts` - line 20 (`console.log` mã OTP ra stdout)
- `api-service/src/app/otp/otp.service.ts` - lines 33-61 (`verifyOtp`: không giới hạn số lần thử sai)

Chưa giới hạn gửi/verify OTP, mã OTP còn bị `console.log` ra.

Ảnh hưởng:
- Spam OTP tốn chi phí SMS
- OTP lộ trong Docker/log hệ thống
- Brute-force mã 6 số vì không có attempt limit

Hướng xử lý:
- Giới hạn gửi: 3 lần/15 phút/số điện thoại
- Giới hạn verify sai: tối đa 5 lần
- Xóa log OTP, invalidate OTP cũ khi tạo mới
- Dùng Redis lưu counter + TTL

Trạng thái: Chưa fix - vẫn dùng trong courier/agency/merchant OTP flow (Task 2).

---

Issue #5 - MinIO bucket public anonymous read
Severity: Major

File & line number:
- `docker-compose.yml` - line 41 (`mc anonymous set public myminio/${AWS_BUCKET_NAME}`)

Bucket set public bằng `mc anonymous set public` => ai biết URL đều đọc được file.

Ảnh hưởng:
- Giấy phép kinh doanh, tài liệu merchant/file nội bộ bị lộ
- Không kiểm soát truy cập file private

Hướng xử lý:
- Bỏ public toàn bucket
- Tách `public/` (ảnh sản phẩm) và `private/` (tài liệu nhạy cảm)
- File private truy cập qua pre-signed URL

Trạng thái: Đã fix - bỏ `anonymous set public`; upload private + pre-signed URL 7 ngày.

---

Issue #6 - Open redirect qua `returnUrl` trên B2C login
Severity: Minor

File & line number:
- `front-b2c/src/app/pages/login/login.component.ts` - lines 53-54 (`navigateByUrl(returnUrl)` không validate)
- `front-b2c/src/app/pages/product-detail/product-detail.component.ts` - lines 154-156 (truyền `returnUrl` từ `router.url`)
- `front-b2c/src/app/pages/cart/cart.component.ts` - line 53 (truyền `returnUrl: '/cart'`)

Sau đăng nhập thành công, frontend redirect thẳng tới `returnUrl` từ query string mà không kiểm tra URL nội bộ. Attacker có thể dụ người dùng mở link `/login?returnUrl=//evil.com`.

Ảnh hưởng:
- Phishing: user tin tưởng domain hợp lệ nhưng bị đẩy sang site giả sau login
- Không chiếm session trực tiếp như Issue #1/#2, nhưng gây nhầm lẫn và lừa đảo

Hướng xử lý:
- Chỉ cho phép path nội bộ bắt đầu bằng `/`
- Reject `//`, `http://`, `javascript:`
- Fallback về `/` nếu `returnUrl` không hợp lệ

Trạng thái: Đã fix - `sanitizeReturnUrl()` trong shared, dùng tại B2C login.

---

Issue #7 - PII user/permissions serialize vào URL OAuth callback
Severity: Minor

File & line number:
- `api-service/src/app/auth/auth.controller.ts` - lines 204-205 (Google: `user` + `permissions` JSON trong query)
- `api-service/src/app/auth/auth.controller.ts` - lines 342-343 (Kakao: `user` + `permissions` JSON trong query)

Ngoài `access_token`, backend còn đưa toàn bộ object `user` (email, tên, role) và mảng `permissions` vào URL. Dữ liệu này lộ qua history/log tương tự token, dù mức độ nghiêm trọng thấp hơn vì không dùng trực tiếp để gọi API.

Ảnh hưởng:
- Email, role, permission list lộ trong browser history và server access log
- Hỗ trợ attacker profiling tài khoản admin/merchant trước khi khai thác thêm

Hướng xử lý:
- Chỉ truyền opaque `code` qua URL; frontend đổi code lấy token + profile qua POST
- Hoặc set profile vào httpOnly session cookie sau exchange

Trạng thái: Đã fix cùng Issue #1 - URL chỉ còn `oauth_code`.

---

3. Top 3 nghiêm trọng nhất

1. OAuth token trên URL (#1): Chiếm session trực tiếp; admin bị lộ là mất toàn hệ thống 
2. Open redirect qua Host (#2): Kết hợp #1 để đẩy token về domain attacker 
3. API product public (#3): Không cần đăng nhập vẫn scrape toàn bộ catalog + merchant 

Ba issue này khai thác từ xa được, ảnh hưởng production ngay, nên fix trước các issue Major/Minor.

---

4. Phân loại severity

Critical: 3 (#1, #2, #3)
Major: 2 (#4, #5)
Minor: 2 (#6, #7)

Tổng: 7 issues (vượt yêu cầu tối thiểu 5).

---

5. Issues xuyên tầng (Backend => API => Frontend)

- Một số vấn đề không chỉ nằm ở một layer - cần fix đồng bộ nhiều tầng mới triệt để:

# Cross-layer Issue Summary
- Trong quá trình review, mình thấy có một số lỗi ảnh hưởng xuyên suốt từ backend, API, frontend đến infra. Các lỗi này chủ yếu liên quan đến bảo mật, rò rỉ dữ liệu và sai lệch luồng xác thực nếu đưa lên production.

1. OAuth token truyền qua URL

- Backend redirect về frontend kèm `access_token`, `user`, `permissions` trên query string, sau đó frontend đọc trực tiếp từ URL để login.

- Cách này rủi ro vì token có thể bị lưu trong browser history, nginx/proxy log hoặc lộ qua referrer. Nếu token bị lộ, attacker có thể dùng để truy cập hệ thống.

- Hướng xử lý: không truyền token qua URL, nên dùng HttpOnly Secure Cookie hoặc authorization code ngắn hạn rồi frontend gọi API để exchange token.

---

2. OAuth redirect phụ thuộc `Host` header

- OAuth callback đang build frontend URL dựa trên `Host` header. Nếu proxy không kiểm soát chặt, `Host` có thể bị spoof.
- Rủi ro là backend có thể redirect token/callback sang domain không hợp lệ, dẫn đến open redirect hoặc mất token.
- Hướng xử lý: dùng danh sách frontend URL cố định theo environment và cấu hình nginx/proxy reject các `Host` không hợp lệ.

---

3. Product API public trả dữ liệu quá rộng

- Endpoint `GET /products` chưa có guard rõ ràng và chưa filter theo trạng thái sản phẩm.
- Điều này có thể làm lộ sản phẩm `DRAFT`, chưa publish hoặc các field nội bộ nếu B2C gọi nhầm endpoint.
- Hướng xử lý: tách API public và management. Public API chỉ trả sản phẩm `PUBLISHED`, còn management API kiểm soát theo role.

---

4. OTP flow chưa có rate limit

- OTP request/verify chưa giới hạn số lần gọi, dễ bị spam hoặc brute-force.
- Rủi ro là attacker có thể spam OTP, thử mã liên tục hoặc gây tốn chi phí SMS/email. Nếu log có OTP plaintext thì còn có nguy cơ lộ mã xác thực.
- Hướng xử lý: thêm rate limit theo IP/phone/email, giới hạn số lần verify sai, set OTP expiration và không log OTP ở production.

---

5. MinIO bucket public

- Upload service trả public URL và bucket có thể truy cập anonymous.

- Cách này tiện cho ảnh public, nhưng nguy hiểm nếu upload file nhạy cảm như giấy tờ, avatar nội bộ hoặc tài liệu xác minh.

- Hướng xử lý: dùng private bucket và signed URL có thời hạn. Nếu cần public ảnh sản phẩm thì nên tách riêng bucket public.

---

6. `returnUrl` phía B2C chưa kiểm soát chặt

- Frontend có xử lý `returnUrl` trong login flow. Nếu không validate, người dùng có thể bị redirect sang website bên ngoài sau khi đăng nhập.
- Rủi ro là attacker tạo link login hợp lệ rồi điều hướng người dùng sang trang giả mạo.
- Hướng xử lý: chỉ cho phép `returnUrl` là internal path, ví dụ bắt đầu bằng `/`, và chặn các URL dạng `http://`, `https://`, `//evil.com`.

---

7. PII bị đưa vào URL

- OAuth callback serialize cả `user` và `permissions` vào query string.
- Dữ liệu này có thể chứa email, role, permission và bị lưu trong access log, browser history hoặc tracking tool.

Hướng xử lý: không truyền user object qua URL. Sau khi login, frontend nên gọi `/auth/me` để lấy thông tin user an toàn hơn.

8. CI/CD checks & lint rules ngăn tái phát

### Security - CI pipeline (GitHub Actions / tương đương)

## CI/CD checks đề xuất

Để hạn chế các lỗi bảo mật tương tự lặp lại, mình đề xuất thêm một số bước kiểm tra tự động trong CI/CD trước khi merge PR.

1. Secret scanning

Dùng Gitleaks hoặc TruffleHog để quét các secret bị commit nhầm như JWT secret, access token, API key hoặc thông tin database.

Check này nên chạy trên mỗi Pull Request và fail PR nếu phát hiện secret thật.

---

2. Static security scan

Dùng Semgrep để bắt các pattern nguy hiểm trong code, ví dụ:

- `res.redirect` có truyền `access_token`
- `console.log` có chứa OTP
- controller public nhưng không khai báo rõ lý do
- API trả về full entity không qua DTO mapping

Mục đích là phát hiện sớm các lỗi bảo mật ngay từ lúc review code.

---

3. Dependency vulnerability scan

Dùng `npm audit` hoặc Snyk để kiểm tra lỗ hổng bảo mật từ package bên thứ ba.

CI nên fail nếu phát hiện dependency có mức độ `Critical`, còn mức `High` có thể yêu cầu review hoặc tạo ticket xử lý.

---

4. Guard audit cho controller

Thêm custom script để scan các file `*.controller.ts`.

Mục tiêu là kiểm tra mỗi endpoint `@Get`, `@Post`, `@Patch`, `@Delete` phải có `@UseGuards` hoặc được đánh dấu public rõ ràng trong whitelist.

Cách này giúp tránh việc tạo API mới nhưng quên phân quyền.

---

5. Docker compose security lint

Thêm bước kiểm tra `docker-compose*.yml` để tránh cấu hình public bucket hoặc service nhạy cảm.

Ví dụ CI có thể fail nếu phát hiện cấu hình như:

```bash
grep -r "anonymous set public" docker-compose*.yml && exit 1

### ESLint / custom rules (frontend)

- Ngoài CI/CD ở backend và infra, frontend cũng nên có thêm một số lint rule để chặn các pattern đăng nhập không an toàn ngay từ lúc code review.

### 1. Không đọc access token trực tiếp từ URL

- Hiện tại `login.component.ts` có logic đọc `access_token` từ `queryParams`. Đây là pattern rủi ro vì token có thể bị lộ qua browser history, referrer hoặc log.

- Nên thêm ESLint rule để cấm các đoạn code kiểu:
```ts
queryParams['access_token']
params['access_token']

### NestJS / backend lint

## Backend lint rules đề xuất

- Bên backend nên bổ sung thêm một số rule để tránh việc API bị mở public ngoài ý muốn, log dữ liệu nhạy cảm hoặc thiếu rate limit ở các flow quan trọng.

1. Controller public phải khai báo rõ ràng

- Các controller method không nên mặc định public nếu không có guard. Mỗi endpoint cần rơi vào một trong hai trường hợp:

- Có guard bảo vệ bằng `@UseGuards(...)`
- Hoặc được đánh dấu public rõ ràng bằng `@Public()`

- Rule này giúp tránh lỗi developer tạo API mới nhưng quên phân quyền. Những endpoint public như login, register, request OTP vẫn được phép public, nhưng phải khai báo explicit để reviewer dễ kiểm soát.

---

2. Không dùng `console.log` trong API service

- Backend nên bật ESLint rule `no-console` ở mức `error` cho toàn bộ thư mục `src/`, ngoại trừ file bootstrap nếu cần log khi app start.
- Lý do là `console.log` dễ làm lộ dữ liệu nhạy cảm như OTP, token, request body, thông tin user hoặc lỗi nội bộ.
- Thay vào đó nên dùng logger chuẩn của framework, có phân cấp log như:

```ts
logger.error(...)
logger.warn(...)
logger.debug(...)

### Pre-commit hooks (Husky - repo đã có `prepare: husky`)

```text
- lint-staged: eslint --fix trên api-service + front-*
- guard-audit.sh: fail nếu controller thiếu guard
- no-otp-log.sh: fail nếu diff chứa console.log.*OTP
```

### Test bắt buộc trong CI

- E2E: OAuth redirect không chứa `access_token` trong Location header - ngăn #1, #7
- Unit: `getFrontendUrlFromHost` reject host không trong allowlist - ngăn #2
- Integration: `GET /api/products` trả 401 không có token - ngăn #3
- Unit: OTP request bị reject sau 3 lần/15 phút - ngăn #4
- Unit: `sanitizeReturnUrl('//evil.com')` => `'/'` - ngăn #6

---

8. Kế hoạch sprint 1 tuần xử lý issues

Giả định: 1 engineer full-time, ưu tiên security trước, song song test + CI.

### Tuần 1 - Sprint plan

- Thứ 2 - OAuth refactor: code exchange flow thay token-on-URL (#1, #7): `POST /auth/oauth/exchange`, Redis store code TTL 60s; xóa `access_token` khỏi redirect
- Thứ 2 - Frontend: cập nhật login (management + b2b) đổi code => token (#1, #7): PR + manual test Google/Kakao login
- Thứ 3 - Host allowlist + fix `getFrontendUrlFromHost` / OAuth guards (#2): Allowlist env vars; unit test reject invalid host
- Thứ 3 - E2E test OAuth redirect security (#1, #2): CI job pass
- Thứ 4 - OTP rate limiting + xóa debug log (#4): Redis counter; `@Throttle`; xóa line 20 `otp.service.ts`
- Thứ 4 - OTP unit + integration tests (#4): 3 tests: rate limit, expire, max attempts
- Thứ 5 - MinIO: private bucket + pre-signed URL cho docs (#5): Sửa `docker-compose.yml`; update upload service
- Thứ 5 - B2C `sanitizeReturnUrl` helper + apply login/cart/detail (#6): Shared util + 2 unit tests
- Thứ 6 - CI/CD: Semgrep + guard-audit script + Husky hooks (tất cả): GitHub Actions workflow `.github/workflows/security.yml`
- Thứ 6 - Verify Issue #3: ownership guard `GET /products/merchant/:id` (#3): Guard + test
- Thứ 7 - Regression test toàn bộ auth + product + OTP (tất cả): Checklist sign-off; cập nhật TASK1_EXPLAIN trạng thái fix

### Phân bổ effort (ước lượng)

- P0 (ngày 1–3) - #1, #2, #7 - ~60% sprint: Block release nếu chưa xong
- P1 (ngày 4–5) - #4, #5, #6 - ~30% sprint: Có thể ship sau P0 24h
- P2 (ngày 6–7) - #3 residual, CI - ~10% sprint: #3 đã fix phần lớn ở Task 3

### Definition of Done (cuối sprint)

- Không còn `access_token` trong URL OAuth (verified bằng E2E)
- Host redirect chỉ về allowlist domains
- OTP có rate limit + không log mã
- MinIO bucket không public anonymous
- B2C `returnUrl` được sanitize
- CI fail PR nếu vi phạm guard-audit hoặc OTP log
- Tất cả unit/E2E tests pass trên PR
