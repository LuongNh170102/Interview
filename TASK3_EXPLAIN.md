TASK 3 - Merchant Product Flow & B2C Display

1. Những gì đã làm

1.1 Phân tích hiện trạng (Step 3.1)

Trước khi implement:
- Product API có CRUD cơ bản nhưng GET /products public, không lọc merchant approved
- Không có Order/Cart module dù Prisma schema đã có
- front-management: route /products/list trỏ under-development
- front-b2c: routes rỗng, chưa có storefront
- shared: chưa có product/order service

1.2 Backend Product API (Step 3.2)

File:
- api-service/src/app/product/product.controller.ts
- api-service/src/app/product/product.service.ts
- api-service/src/app/product/dto/product-query.dto.ts

Thay đổi:
- GET /api/products/public - paginated, chỉ isActive + merchant APPROVED + ACTIVE (B2C)
- GET /api/products/public/:id - chi tiết public
- GET /api/products - JwtAuthGuard + product:read + pagination (management)
- GET /api/products/:id - guarded (management)
- GET /api/products/merchant/:id - guarded product:read
- categoryId lưu trong metadata (schema không có FK category trực tiếp)

Giữ nguyên:
- POST create: ResourceStatusGuard (merchant APPROVED) + MerchantOwnershipPipe
- PATCH/DELETE: ProductOwnershipGuard

1.3 Backend Cart + Order (Step 3.3)

Module: api-service/src/app/order/

Cart API:
- GET /api/cart?merchantId=
- POST /api/cart/items
- PATCH /api/cart/items/:productId
- DELETE /api/cart/items/:productId
- DELETE /api/cart

Order API:
- POST /api/orders - tạo đơn từ cart
- GET /api/orders - danh sách đơn của user
- GET /api/orders/:id - chi tiết đơn

Courier selection (nice-to-have => implemented):
- Chỉ courier APPROVED + ACTIVE + ONLINE + có lat/lng
- Haversine distance chọn courier gần delivery address nhất
- Sau assign => availabilityStatus = BUSY

Unit test: order.service.spec.ts - 3 tests (nearest courier, no courier, validation)

1.4 Merchant mine endpoint

- GET /api/merchants/mine - merchant owner lấy store của mình
- Dùng cho product management UI khi không có system:manage_users

1.5 Shared layer (Step 3.4)

- shared/src/lib/interfaces/product.interface.ts
- shared/src/lib/interfaces/order.interface.ts
- shared/src/lib/services/product.service.ts
- shared/src/lib/services/order.service.ts
- Export qua shared/src/index.ts

1.6 Frontend Management (Step 3.5)

Trang: front-management/src/app/pages/products/products-list/

Route: /products/list (thay under-development)

Tính năng:
- Chọn merchant (admin: findAll, merchant owner: findMine)
- Danh sách sản phẩm theo merchant (pagination, search)
- Thêm/Sửa/Xóa qua modal form
- Form: name, description, price, stock, sku, category, images, publishStatus (DRAFT/PUBLISHED/ARCHIVED)
- Drag-drop upload, preview trước publish, upload ảnh khi edit
- Toast qua GlobalModalService

i18n: admin.products.* (vi, en, ko)

1.7 Frontend B2C (Step 3.6)

App: front-b2c/

Routes:
- / - product listing (public API, skeleton loading)
- /products/:id - detail + add to cart
- /cart - giỏ hàng + checkout (delivery address + lat/lng)
- /login - đăng nhập customer

Setup:
- HttpClient + authInterceptor + APP_INITIALIZER refresh token
- proxy.conf.json => localhost:3000

2. Lý do kỹ thuật

2.1 Tách public vs management product API

- Fix Issue #3 Task 1: GET /products cũ leak toàn bộ data
- B2C chỉ gọi /products/public - filtered server-side
- Management gọi guarded endpoints - cần product:read

2.2 categoryId trong metadata

- Product schema có sectionId (menu) nhưng không có categoryId FK
- Assignment yêu cầu category trong form => lưu metadata.categoryId (external UUID)
- Tránh migration thêm bảng trung gian trong thời gian giới hạn

2.3 Cart theo merchant

- Schema Cart có merchantId - mỗi giỏ gắn 1 store
- B2C lưu merchantId trong sessionStorage khi add item đầu tiên
- Order tạo từ cart items của cùng merchant

2.4 Courier nearest selection

- Prisma có latitude/longitude trên Courier (chuẩn bị từ Task 2)
- Haversine đủ cho MVP; PostGIS là nice-to-have
- Throw error nếu không có courier eligible - tránh đơn không ai giao

2.5 Merchant mine vs findAll

- MERCHANT_OWNER không có system:manage_users
- findMine trả store của user => product CRUD đúng ownership pipe

3. Bảo mật & ổn định

- Product create: merchant APPROVED + ownership validation
- GET /products/merchant/:merchantId: MerchantAccessGuard - merchant owner/agency/admin only
- Cart/Order: JwtAuthGuard + order:create/read permissions
- Public API chỉ trả publishStatus=PUBLISHED + merchant APPROVED
- Order validate publishStatus=PUBLISHED trước khi tạo đơn

4. Test & verify

Build:
- npx nx build api-service
- npx nx build front-management
- npx nx build front-b2c

Unit test:
- npx nx test api-service --testFile=src/app/order/order.service.spec.ts

Chạy local:
```powershell
docker compose up -d postgres minio createbuckets
npx prisma generate && npx prisma migrate deploy && npx prisma db seed

npx nx serve api-service                    # :3000
npx nx serve front-management --port=4300   # quản lý sản phẩm
npx nx serve front-b2c --port=4200          # storefront B2C
```

Luồng thủ công:
1. Admin login => /products/list => chọn merchant => thêm sản phẩm (APPROVED merchant)
2. Approve courier + set ONLINE + lat/lng (qua DB hoặc API)
3. Customer login B2C => xem sản phẩm => add cart => checkout với lat/lng
4. Kiểm tra order có courierId được assign

5. Bổ sung Must Have & Nice-to-have (hoàn thành)

Must Have:
- MerchantAccessGuard trên GET /products/merchant/:merchantId
- findAllByMerchant xử lý search (SKU + tên vi/en)
- products-list.component.spec.ts (4 tests)

Nice-to-have đã làm:
- ProductStatus DRAFT/PUBLISHED/ARCHIVED (migration + sync isActive)
- In-memory TTL cache public listing (SimpleCacheService, 60s) - thay Redis MVP
- Full-text search cơ bản (contains + JSON path name vi/en)
- PATCH product upload ảnh mới (merge vào metadata.images)
- Management: drag-drop upload, preview modal, publishStatus workflow, multi-image edit
- B2C: Title/Meta theo route (list, detail, cart); cart skeleton loading
- Order admin UI: GET /api/orders/manage/list + trang /orders management

Bổ sung thêm:
- Redis cache (`CacheService` + `REDIS_URL`, fallback in-memory)
- PostGIS `ST_Distance` cho courier selection (fallback Haversine)
- PostgreSQL full-text search (`search_vector` + GIN index)
- B2C `PreloadAllModules`, `CartStateService` (signals)
