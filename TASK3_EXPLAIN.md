\# TASK 3 – Merchant Product Flow \& B2C Display



\## Part A – Backend



\### What I Did

\- Backend product API was already implemented with all required endpoints

\- Verified: `POST /api/products` requires MERCHANT\_OWNER role + APPROVED merchant status

\- Verified: `GET /api/products/merchant/:merchantId` supports pagination

\- Verified: Only APPROVED couriers with ONLINE status are eligible (from schema)



\### Why

The existing ProductService and ProductController already enforce the required business rules via guards (`ResourceStatusGuard`, `ProductOwnershipGuard`, `PermissionsGuard`).



\---



\## Part B – Frontend Management



\### What I Did

\- Created `ProductService` in shared library with `findAllByMerchant`, `create`, `update`, `remove`

\- Created `ProductManagementComponent` with full CRUD: list, add modal, edit modal, delete modal

\- Added route at `/products/product-management`

\- Added menu item under Products section



\### Why

Following the same DataTable pattern as Agencies/Merchants ensures UI consistency. Modal-based CRUD keeps the user on the same page without navigation overhead.



\### Trade-offs

\- Multiple image upload (Nice to Have) deprioritized

\- Product status toggle simplified to inline edit

\- merchantId is hardcoded as demo — in real app, would come from auth context (MERCHANT\_OWNER's merchant)



\---



\## Part C – Frontend B2C



\### What I Did

\- Created `B2CProductService` for fetching products from API

\- Created `CartService` using Angular signals for in-memory cart state

\- Created Product List page with grid layout and add-to-cart

\- Created Product Detail page with full product info and add-to-cart

\- Created Cart page with quantity controls and order placement

\- Configured routes in `app.routes.ts` with lazy loading

\- Added `provideHttpClient()` to app config



\### Why

Using Angular signals for cart state avoids external state management libraries (NgRx/Akita) while still being reactive and performant. Lazy loading routes improves initial load time.



\### Trade-offs

\- Skeleton loading (Nice to Have) replaced with simple spinner

\- SEO optimization (Nice to Have) deprioritized

\- Order creation calls a simple alert — real implementation would call order API

