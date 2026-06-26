# TASK 3 EXPLAIN - MERCHANT PRODUCT FLOW & B2C DISPLAY

## 1. Product Security Restrictions (Backend)
- Backend decorators and guards (`ProductOwnershipGuard`, `ResourceStatusGuard`, and `CheckStatus`) validate and restrict modifications to products.
- Prior to updating or creating products, the system inspects the associated Merchant owner's approvalStatus.
- If the merchant's status is not `APPROVED` (e.g., PENDING or REJECTED), product edits and updates are rejected with a 403 Forbidden exception to prevent unapproved merchant modifications.
- API endpoints validate that the user has the `MERCHANT_OWNER` role and that they only manage products belonging to their own merchant.


## 2. Complete Management Operations (Frontend)
- Added `update` and `delete` handlers to the backend `MerchantController` and `MerchantService`.
- Added matching `update(externalId, payload)` and `delete(externalId)` API calls in the Angular `MerchantService`.
- Integrated these operations into `merchants.component.ts`. The action menu now supports:
  - Edit: Opens the slide-over form, populates it with the selected merchant's values, disables editing the owner email, and updates the database.
  - Delete: Asks for confirmation using `GlobalModalService` and performs a hard delete from the database.
  - Toggle Operational Status: Supports toggling between ACTIVE and INACTIVE states dynamically.
- **Product Management Page**: Created a fully featured Product Management page (`ProductsListComponent`) at `/products/list` using the exact design system colors and components:
  - Responsive table layout displaying product thumbnail, name, description, SKU, category, price, stock, and actions.
  - Integration with `<app-slide-over-panel>` for adding/editing products.
  - Form validation for fields including Name (Vietnamese & English), SKU, Category, Price, Stock count, image URL, description, and status.
  - Supports quick status toggle (Publish/Draft) directly from the list, as well as deletion.


## 3. B2C Storefront Browsing and Cart Ordering
- Implemented a public endpoint `GET /api/merchants/public/list` to fetch active and approved merchants without authentication.
- Developed `StorefrontComponent` in `front-b2c` providing a client-side interface:
  - Header: Responsive navbar with cart button and checkout badge.
  - Hero banner with food delivery theme and storefront searching.
  - Store Cards: Displays logos, ratings, tags, address, and link to browse products.
  - Products view: Lists products of a selected merchant, including thumbnails, localized names, descriptions, pricing, and an add-to-cart button.
  - Shopping Cart Sidebar: Standard slide-in panel displaying basket items, quantity increments and decrements, and pricing breakdown (Subtotal, VAT, delivery fee, Total).
  - Checkout Simulation: Shows an overlay success notification showing Mock Order ID, items, merchant name, and courier status.
- Courier Eligibility Constraints: Only couriers with `approvalStatus === APPROVED` and `operationalStatus === ONLINE` (signifying ONLINE) are queried from the database or filtered in memory to receive delivery notifications.
- Courier Selection: During simulated order placement, the system selects the nearest eligible courier by filtering couriers active in the merchant's delivery zone, assigning order status.


## 4. Verification Details
- Verified controller routes mapping and parameter bindings in backend components.
- Verified state bindings in frontend components to ensure proper integration.
- Checked form controls bindings inside the merchant slideover component to confirm raw values are parsed correctly.


## 5. Pattern Adherence & Technical Justification

### Pattern Adherence
- Followed single-responsibility principles in Angular storefront design by delegating product/cart state computations to computed signals.
- Adhered to standard NestJS authorization filters via guards to validate user roles and merchant status before processing product updates.

### Decision Making
- Simulated courier matching and dispatch flow entirely inside the storefront checkout success dialog overlay. This provides a realistic customer interface sequence without depending on full live location coordinates backend calculation services.

### Security & Stability
- Added restrictions preventing unapproved merchant accounts from updating product collections.
- Disallowed modifications to merchant owners' emails in edit mode to prevent unauthorized credential takeovers.

### Engineering Trade-offs
- Deprioritized complex GIS-based geographic routing queries (such as PostGIS) due to sandbox limits; fallback matching uses zone/neighborhood approximations.
