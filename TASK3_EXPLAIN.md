# TASK 3 - Luồng quản lý sản phẩm Merchant và hiển thị B2C

## 1. Tổng quan

Task này triển khai luồng quản lý sản phẩm và đặt hàng giữa Front Management và B2C storefront.

Luồng nghiệp vụ chính:

1. Merchant Owner đăng nhập vào Front Management.
2. Merchant Owner quản lý sản phẩm trong cửa hàng của mình.
3. Sản phẩm active/published được hiển thị ở B2C storefront.
4. Customer xem danh sách sản phẩm và thêm vào giỏ hàng.
5. Customer checkout để tạo order.
6. Backend kiểm tra các rule nghiệp vụ và chọn courier đủ điều kiện.
7. Management user có thể xem lại các order đã tạo.

Thiết kế giữ đúng với schema hiện tại: một order thuộc một merchant.

## 2. Phần A - Yêu cầu Backend

### Kiểm tra merchant đã được approve trước khi tạo product

API tạo product được bảo vệ bằng kiểm tra trạng thái merchant.

Hành vi đã triển khai:

- Chỉ merchant có trạng thái approved mới được tạo product.
- Trạng thái merchant được kiểm tra trước khi cho phép create product.
- Nếu merchant chưa approved, API reject request.

File chính:

- `api-service/src/app/product/product.controller.ts`
- `api-service/src/app/common/guards/resource-status.guard.ts`
- `api-service/src/app/common/pipes/merchant-ownership.pipe.ts`

### Kiểm tra quyền Merchant Owner

Các thao tác tạo, cập nhật và xóa product đều kiểm tra user hiện tại có role `MERCHANT_OWNER`.

Hành vi đã triển khai:

- Khi tạo product, backend kiểm tra user đang đăng nhập có sở hữu merchant mục tiêu hay không.
- Khi update/delete product, backend kiểm tra product đó thuộc merchant mà user đang quản lý hay không.
- Merchant Owner không thể tạo hoặc sửa product cho cửa hàng của người khác.

File chính:

- `api-service/src/app/common/pipes/merchant-ownership.pipe.ts`
- `api-service/src/app/product/guards/product-ownership.guard.ts`

### Pagination cho API danh sách product

Các API danh sách product hỗ trợ pagination bằng `page` và `limit`.

API đã triển khai:

- `GET /api/products?page=1&limit=10`
- `GET /api/products/merchant/:merchantId?page=1&limit=10`

Format response:

```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "lastPage": 1,
    "limit": 10
  }
}
```

File chính:

- `api-service/src/app/product/product.controller.ts`
- `api-service/src/app/product/product.service.ts`
- `api-service/src/app/common/dto/pagination.dto.ts`

### Lọc product public cho B2C

API product public chỉ trả về các sản phẩm customer có thể đặt.

Rule lọc:

- Product phải active.
- Merchant phải approved.
- Merchant phải đang nhận order.

Điều này giúp B2C không hiển thị sản phẩm của merchant chưa duyệt hoặc không còn nhận đơn.

### Tạo order

Order được tạo qua API:

- `POST /api/orders`

Backend xử lý khi tạo order:

1. Kiểm tra merchant tồn tại.
2. Kiểm tra merchant đã approved và đang nhận order.
3. Kiểm tra tất cả product thuộc đúng merchant.
4. Kiểm tra product đang active.
5. Tính tổng tiền từ product price trong database.
6. Chọn courier đủ điều kiện.
7. Tạo order và order items.

File chính:

- `api-service/src/app/order/order.controller.ts`
- `api-service/src/app/order/order.service.ts`
- `api-service/src/app/order/dto/create-order.dto.ts`

### Điều kiện courier và chọn courier gần nhất

Logic chọn courier được triển khai trong order service.

Courier đủ điều kiện khi:

- Approval status là `APPROVED`.
- Operational status là `ACTIVE`.
- Availability status là `ONLINE`.

Nếu payload checkout có customer location, backend sẽ xếp hạng courier theo khoảng cách bằng công thức Haversine và chọn courier gần nhất.

File chính:

- `api-service/src/app/order/order.service.ts`

## 3. Phần B - Yêu cầu Frontend Management cho Merchant

### Trang Product Management

Front Management có trang Product Management cho Merchant Owner.

Hành vi đã triển khai:

- Load danh sách cửa hàng mà Merchant Owner đang quản lý.
- Chọn cửa hàng cần quản lý.
- Hiển thị product của cửa hàng đã chọn.
- Pagination danh sách product.
- Thêm product.
- Cập nhật product.
- Xóa product.

File chính:

- `front-management/src/app/pages/products/product-list/product-list.component.ts`
- `front-management/src/app/pages/products/product-list/product-list.component.html`
- `front-management/src/app/pages/products/product-list/product-list.component.scss`

### Form tạo product

Form product bao gồm các field cần thiết:

- Name.
- Description.
- Price.
- Images.
- Category.
- SKU.
- Stock.
- Active status.

Ảnh được gửi bằng multipart form data. Backend nhận nhiều ảnh qua `FilesInterceptor('images', 10)`.

### Cập nhật và xóa product

Merchant Owner có thể:

- Mở product hiện có ở chế độ edit.
- Cập nhật thông tin product.
- Xóa product khỏi merchant đã chọn.

Các request update/delete vẫn được backend kiểm tra ownership.

### Route Management

Route Product Management đã được cấu hình trong app routes của Management.

File chính:

- `front-management/src/app/app.routes.ts`

## 4. Phần C - Yêu cầu Frontend B2C Storefront

### Trang danh sách product

B2C có trang shop:

- `/shop`

Hành vi đã triển khai:

- Gọi `GET /api/products` để lấy product public.
- Hiển thị product image, name, description, price, category và merchant.
- Product card có link sang trang chi tiết sản phẩm.
- Có loading state khi đang fetch product.
- Có error state khi load product thất bại.
- Có pagination.

File chính:

- `front-b2b/src/app/pages/shop/shop.component.ts`
- `front-b2b/src/app/pages/shop/shop.component.html`
- `front-b2b/src/app/pages/shop/shop.component.scss`

### Trang chi tiết product

B2C có trang chi tiết sản phẩm:

- `/shop/:id`

Trang này gọi `GET /api/products/:id` và hiển thị các thông tin chính:

- Product image.
- Product name.
- Product description.
- Product price.
- Product category.
- Merchant name.
- SKU.
- Stock.

Customer có thể xem thông tin chi tiết và thêm product vào cart từ trang này.

File chính:

- `front-b2b/src/app/pages/product-detail/product-detail.component.ts`
- `front-b2b/src/app/pages/product-detail/product-detail.component.html`
- `front-b2b/src/app/pages/product-detail/product-detail.component.scss`

### Luồng cart

Cart được quản lý ở frontend B2C.

Hành vi đã triển khai:

- Thêm product vào cart.
- Gộp quantity nếu thêm cùng product nhiều lần.
- Giữ cart theo một merchant.
- Từ chối thêm product từ merchant khác vào cùng cart.
- Lưu cart local trong phiên mua hàng.

File chính:

- `front-b2b/src/app/shared/services/cart.service.ts`

### Luồng tạo order

Checkout được triển khai tại:

- `/checkout`

Hành vi đã triển khai:

1. Customer mở checkout.
2. Auth guard yêu cầu customer login.
3. Customer nhập thông tin giao hàng.
4. Frontend build order payload từ cart items.
5. Frontend gọi `POST /api/orders`.
6. Nếu thành công, cart được clear và hiển thị kết quả order.
7. Nếu thất bại, cart được giữ lại để customer có thể thử lại.

File chính:

- `front-b2b/src/app/pages/checkout/checkout.component.ts`
- `front-b2b/src/app/pages/checkout/checkout.component.html`
- `front-b2b/src/app/pages/checkout/checkout.component.scss`
- `shared/src/lib/services/order.service.ts`

### Lazy loading routes

Các route B2C dùng Angular `loadComponent` để lazy load component.

File chính:

- `front-b2b/src/app/app.routes.ts`

## 5. Management Order Review

Ngoài luồng product và B2C, Management có thêm trang review order.

API đã triển khai:

- `GET /api/orders?page=1&limit=10`

Rule truy cập:

- Platform Admin xem được toàn bộ order.
- Merchant Owner chỉ xem order của các cửa hàng mình quản lý.

File chính:

- `api-service/src/app/order/order.controller.ts`
- `api-service/src/app/order/order.service.ts`
- `front-management/src/app/pages/orders/orders.component.ts`
- `shared/src/lib/services/order.service.ts`

## 6. Các rule nghiệp vụ quan trọng

| Rule | Cách triển khai |
| --- | --- |
| Merchant phải approved trước khi tạo product | Resource status guard và ownership pipe |
| User phải là Merchant Owner | Merchant ownership validation |
| Merchant Owner không được quản lý product của cửa hàng khác | Product ownership guard |
| Product public chỉ hiển thị sản phẩm có thể đặt | Product service lọc active product và approved merchant |
| Cart chỉ chứa product của một merchant | Cart service reject product khác merchant |
| Backend không tin giá từ frontend | Order service tính lại tổng tiền từ database |
| Courier phải approved và online | Order service lọc courier đủ điều kiện |
| Chọn courier gần nhất | Xếp hạng khoảng cách bằng công thức Haversine |

## 7. Files đã thay đổi

Backend:

- `api-service/src/app/product/product.controller.ts`
- `api-service/src/app/product/product.service.ts`
- `api-service/src/app/product/guards/product-ownership.guard.ts`
- `api-service/src/app/common/pipes/merchant-ownership.pipe.ts`
- `api-service/src/app/order/order.controller.ts`
- `api-service/src/app/order/order.service.ts`
- `api-service/src/app/order/dto/create-order.dto.ts`
- `api-service/src/app/order/order.module.ts`
- `api-service/src/app/app.module.ts`
- `prisma/seed.ts`

Management frontend:

- `front-management/src/app/pages/products/product-list/product-list.component.ts`
- `front-management/src/app/pages/products/product-list/product-list.component.html`
- `front-management/src/app/pages/products/product-list/product-list.component.scss`
- `front-management/src/app/pages/orders/orders.component.ts`
- `front-management/src/app/app.routes.ts`

B2C frontend:

- `front-b2b/src/app/pages/shop/shop.component.ts`
- `front-b2b/src/app/pages/shop/shop.component.html`
- `front-b2b/src/app/pages/shop/shop.component.scss`
- `front-b2b/src/app/pages/product-detail/product-detail.component.ts`
- `front-b2b/src/app/pages/product-detail/product-detail.component.html`
- `front-b2b/src/app/pages/product-detail/product-detail.component.scss`
- `front-b2b/src/app/pages/checkout/checkout.component.ts`
- `front-b2b/src/app/pages/checkout/checkout.component.html`
- `front-b2b/src/app/pages/checkout/checkout.component.scss`
- `front-b2b/src/app/shared/services/cart.service.ts`
- `front-b2b/src/app/app.routes.ts`
- `front-b2b/src/app/layout/components/header/header.component.ts`
- `front-b2b/src/app/layout/components/header/header.component.html`

Shared library:

- `shared/src/lib/services/product.service.ts`
- `shared/src/lib/services/order.service.ts`
- `shared/src/lib/services/merchant.service.ts`
- `shared/src/lib/interfaces/product.interface.ts`
- `shared/src/lib/interfaces/order.interface.ts`
- `shared/src/lib/interfaces/merchant.interface.ts`
- `shared/src/index.ts`

## 8. Tests

Commands đã chạy:

```bash
npx prisma db seed
npx nx test api-service --runInBand
npx nx test front-b2b --runInBand
npx nx test front-management --runInBand
npx nx build api-service --skip-nx-cache
npx nx build front-b2b
npx nx build front-management
```

Kết quả:

- `api-service`: 6 test files passed, 15 tests passed.
- `front-b2b`: 6 test files passed, 7 tests passed.
- `front-management`: 4 test files passed, 7 tests passed.
- `api-service build`: passed.
- `front-b2b build`: passed.
- `front-management build`: passed.

Các phần đã có test:

- Public product pagination.
- Order creation validation.
- Eligible courier selection.
- Nearest courier ranking.
- Cart single-merchant behavior.
- B2C shop display.
- B2C product detail display.
- B2C checkout flow.
- Management product flow.
- Management order review.

## 9. Tổng kết

Task 3 đã hoàn thành luồng merchant product và B2C ordering chính:

- Merchant Owner quản lý product trong cửa hàng của mình.
- API product listing có pagination.
- B2C customer xem product và thêm vào cart.
- Customer checkout để tạo order.
- Backend kiểm tra merchant/product/courier trước khi tạo order.
- Hệ thống chọn courier đủ điều kiện và ưu tiên courier gần nhất khi có location.
- Management review order theo đúng quyền admin/merchant owner.
