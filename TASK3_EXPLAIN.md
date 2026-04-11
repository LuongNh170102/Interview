# TASK 3 – Product Management & B2C Storefront

## Executive Summary

---

## Part A – Backend Requirements (10 Points)

### Phân tích & Triển khai

**Must Have:**

- [x] **Merchant must have APPROVED status** trước khi tạo sản phẩm  
       → Kiểm tra `approvalStatus === APPROVED` trong `ProductService.create()`

- [x] **API phải validate role MERCHANT_OWNER**  
       → Sử dụng `PermissionsGuard` + `@Permissions('product:create')`

- [x] **Merchant Owner chỉ tạo sản phẩm cho store của mình**  
       → Sử dụng `MerchantOwnershipPipe` + kiểm tra ownership trong controller/service

- [x] **Pagination cho product listing APIs**  
       → Hỗ trợ `page`, `limit` trong `findAll()` và `findAllByMerchant()`

- [x] **Only couriers with APPROVED and ONLINE status** được nhận đơn  
       → Logic kiểm tra status courier đã sẵn sàng trong order creation flow (có thể mở rộng)

**Nice to Have (đã làm một phần):**

- [ ] Product status: DRAFT / PUBLISHED / ARCHIVED (chưa triển khai)
- [ ] Full-text search (chưa triển khai)
- [ ] Caching (Redis) cho product listing (chưa triển khai)
- [ ] Geo-indexing/PostGIS cho nearest courier (chưa triển khai)

---

## Part B – Frontend Requirements – Merchant Management (15 Points)

### Triển khai

**Must Have:**

- [x] Merchant Owner có thể **thêm sản phẩm** vào store của mình
- [x] Merchant Owner có thể **cập nhật** sản phẩm
- [x] Merchant Owner có thể **xóa** sản phẩm
- [x] Tạo **Product Management Page** hiển thị danh sách sản phẩm của merchant
- [x] Form tạo sản phẩm bao gồm: name, description, price, images, category
- [x] Cấu hình routes cho product management trong `app.routes.ts` (sử dụng lazy loading + permission guard)

**Nice to Have:**

- [ ] Hỗ trợ upload nhiều ảnh sản phẩm
- [ ] Drag & drop image upload
- [x] Pagination cho danh sách sản phẩm
- [ ] Product status toggle (Publish/Unpublish)
- [ ] Preview sản phẩm trước khi publish

---

## Part C – Frontend Requirements – B2C Storefront (15 Points)

### Triển khai

**Must Have:**

- [x] **Product Listing Page** (`/products`)
- [x] **Product Detail Page** (`/products/:externalId`)
- [x] Người dùng có thể **thêm sản phẩm vào giỏ hàng**
- [x] **Order Creation Flow** (Checkout page + tạo đơn hàng)

**Nice to Have:**

- [x] **Skeleton loading** khi fetch dữ liệu (áp dụng trên listing và detail)
- [x] **State management** phù hợp (sử dụng Angular **Signals** cho Cart)
- [x] **Lazy loading routes** cho toàn bộ B2C
- [x] **Tối ưu SEO** cho trang sản phẩm:
  - Dynamic Title
  - Meta description
  - Open Graph tags (`og:title`, `og:image`, `og:description`)
  - Twitter Card

---

## Công nghệ & Best Practices đã áp dụng

- **Frontend**: Angular Standalone Components, Signals, OnPush Change Detection, Lazy Loading
- **State Management**: Signal-based CartService (không phụ thuộc store phức tạp)
- **SEO**: Custom `TitleStrategy` + dynamic Meta & Open Graph tags
- **UI/UX**: Responsive grid, Skeleton loading, Quantity selector, Clean checkout flow
- **Security**: Permission guards, Ownership validation (Merchant Owner chỉ quản lý store của mình)
- **Performance**: Lazy routes, pagination, skeleton loading

---

## Cấu trúc thư mục chính (tóm tắt)

**Backend (api-service):**

- `product/product.controller.ts`
- `product/product.service.ts`
- Guards & Pipes: `ResourceStatusGuard`, `MerchantOwnershipPipe`

**Frontend Merchant (front-management):**

- `pages/products/product-list/`
- Product creation form + management page

**Frontend B2C (front-b2c):**

- `pages/product-list/`
- `pages/product-detail/`
- `pages/cart/`
- `pages/checkout/`
- `shared/services/cart.service.ts`, `order.service.ts`

---
