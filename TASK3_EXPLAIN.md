# TASK3_EXPLAIN

## 1. What You Have Done (The How)

- Implementation details: extended the Prisma product model and migration for product status, category linkage, and supporting indexes.
- Implementation details: expanded the NestJS product slice with stronger DTOs, a query DTO for pagination/filtering, a query builder, entity mapping, and a fuller controller/service surface.
- Implementation details: implemented both public and management product endpoints instead of mixing those concerns in one route.
- Implementation details: added a merchant-owner scoped product-management flow in `front-management` by resolving the current merchant profile instead of forcing owners to pick arbitrary stores.
- Implementation details: added shared product interfaces/services, a focused order backend slice, a management product UI, and a B2C storefront with checkout.
- Pattern adherence: kept public/admin concerns separated, reused shared frontend contracts, and centralized visibility/filter logic in backend query builders rather than scattering rules across controllers and components.
- Pattern adherence: layered the drag-and-drop upload enhancement on top of the existing multipart image-upload pipeline instead of creating a second upload path.
- Testing and verification: validated with backend/frontend tests, production builds, and manual product-management plus checkout flows described below.

## 2. API Surface Delivered

- `POST /api/products`
- `GET /api/products`
- `GET /api/products/admin`
- `GET /api/products/merchant/:merchantId`
- `GET /api/products/admin/:id`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/merchants/me/profile`
- `POST /api/orders`

The public catalog endpoint returns only products that are published, active, and attached to approved merchants. The management endpoints expose the broader product-management surface, while checkout creates an order for the authenticated customer and assigns the nearest eligible courier when merchant and courier coordinates are available, with a safe fallback to the first `APPROVED`, `ACTIVE`, `ONLINE` courier.

## 3. Data and Validation Decisions

- Product `name` and `description` continue to use localized JSON, which matches the project’s multilingual data model.
- Product create/update now support category selection, section linkage, currency, and status handling.
- Category resolution accepts the frontend-facing identifier and now returns a category-specific not-found error if the reference is invalid.
- `price` and `stock` are validated as non-negative numbers.
- Product metadata stays flexible JSON so the current implementation can carry images/thumbnail data without hard-coding every future attribute.

## 4. Frontend and Shared Integration

- Added shared product interfaces/services so the management UI uses typed request/response contracts.
- Added shared order interfaces/services so the B2C checkout page can call the backend order API through typed contracts.
- Registered a real management route at `/products/list`.
- Built a data table with search, stats, pagination, and row actions.
- Added a reusable create/edit form in a slide-over panel.
- Locked the merchant selector for merchant owners by resolving the current merchant from the backend, while still keeping the broader management path usable for higher-privileged users.
- Added drag-and-drop image upload support to the product create/edit form and reused the existing backend file-upload path.
- Implemented `front-b2c` pages for product listing, product detail, local cart state, login/register gating for checkout, order placement, skeleton loading states, infinite scroll, and page-level SEO/meta tags.

## 5. Final Cleanup and Optimization

- Prevented stray `merchantId` data from being applied during product update.
- Disabled merchant selection while editing an existing product so the UI matches backend behavior and avoids accidental cross-merchant reassignment.
- Kept approved-merchant filtering for the public catalog in the query builder so the rule lives in one place.
- Tightened backend validation instead of relying only on frontend form validation.
- Added a dedicated merchant profile endpoint so merchant-owner product management no longer depends on a manually selected merchant ID.
- Kept cart state in the B2C client to keep the checkout slice small and focused while still satisfying the required storefront flow.
- Added nearest-courier selection during order creation by comparing merchant coordinates with courier `currentLocation` data when available.

## 6. Validation and Verification

- `npx nx test api-service --runInBand`
- `CI=1 npx nx build api-service --configuration=production --skip-nx-cache --output-style=static`
- `CI=1 npx nx build front-management --configuration=production --skip-nx-cache --output-style=static`
- `npx nx test front-b2c --runInBand`
- `CI=1 npx nx build front-b2c --configuration=production --skip-nx-cache --output-style=static`

Recommended manual verification flow:

- Open the management UI at `/products/list` as a merchant owner and confirm the page resolves the current merchant automatically.
- Create a product with a valid category and image upload.
- Edit that product and confirm normal field updates still work.
- Delete a product from the table action menu.
- Open `front-b2c`, browse the public catalog, view a product detail page, add it to cart, authenticate, and place an order.
- Call `GET /api/products` and verify that only published, active products from approved merchants appear in the public response.

## 7. Known Limits and Honest Scope

- Cart state is currently client-side in the B2C app; the Prisma `Cart` model remains available for a future persistent-cart implementation.
- Publish preview and persistent cart synchronization were intentionally left out to keep the implementation focused on the assignment scope.

## 8. Technical Justification (The Why)

- Technical decisions:
  - Separating public and admin product endpoints keeps customer-facing visibility rules simple and safe.
  - Centralizing filters in `ProductQueryBuilder` reduces duplication and makes public/admin rule differences explicit.
  - Preserving localized JSON fields avoids creating a second product-text model that conflicts with the rest of the codebase.
  - Adding drag-and-drop uploads on top of the existing multipart flow improved UX without forcing backend API changes.
  - Using nearest-courier selection when coordinates exist raises the delivery assignment quality while preserving a safe fallback path.
- Security and stability:
  - Keeping merchant reassignment out of the update flow reduces authorization ambiguity and keeps the management form predictable.
  - Using a merchant-profile lookup endpoint lets merchant owners manage the correct store without weakening the current auth/session model.
  - The storefront still relies on the public product constraints of published, active products from approved merchants, which keeps customer-facing data exposure controlled.
  - The courier assignment logic falls back to the first eligible courier when coordinates are missing, so order creation remains stable even with partial location data.
- Trade-offs:
  - Cart state is still client-side, which keeps the checkout slice small but does not provide cross-device persistence yet.
  - Drag-and-drop upload improves usability, but image state management in the form becomes more complex because previews must be appended, removed, and revoked safely.
  - Publish preview and persistent cart synchronization were left out to keep the implementation focused on the assignment scope instead of expanding into broader commerce features.
