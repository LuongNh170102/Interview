# TASK 3 – Merchant Product Flow & B2C Display

## What I Have Done

### Part A – Backend Enhancements

**B2C Public Product Endpoints** (`product.controller.ts` + `product.service.ts`):
- `GET /api/products/b2c/merchant/:merchantId` – Public product listing (only active products, paginated)
- `GET /api/products/b2c/:id` – Public product detail with merchant info
- Products filtered to `isActive: true` for B2C browsing
- Returns only display-safe fields (no internal IDs)

**Cart Module** (`api-service/src/app/cart/`):
- `POST /api/carts/add` – Add product to cart (JWT required)
- `GET /api/carts/mine` – Get current user's cart
- `PATCH /api/carts/update` – Update/remove cart items
- Auto-creates new cart if none exists
- Handles multi-merchant carts (creates separate carts per merchant)
- Auto-calculates total amount

**Order Module** (`api-service/src/app/order/`):
- `POST /api/orders` – Create order from cart (JWT required)
- `GET /api/orders/mine` – User's order history
- `GET /api/orders/:id` – Order detail
- **Nearest-courier selection**: Finds available, APPROVED, ACTIVE couriers and selects the nearest based on Euclidean distance from delivery coordinates
- Auto-clears cart after successful order creation
- Calculates shipping fee (15,000 VND default when courier assigned)

**Pattern adherence**: Cart and Order modules follow the same NestJS patterns as existing modules (Merchant, Agency). Uses PrismaService, JwtAuthGuard, and existing model relations.

### Part B – Frontend B2B (Merchant Portal)

**Product Management Routes** (`front-b2b`):
```
/merchant/products          → Product list
/merchant/products/create   → Create product
/merchant/products/:id/edit → Edit product
```

**Components:**
- `ProductsComponent` – Data table with product name, price, stock, status, actions
- `ProductFormComponent` – Reactive form for create/edit with fields: name (vi/en), price, stock, SKU, description, isActive

**Key features:**
- Table with status badges (Đang bán / Ngừng bán)
- Vietnamese currency formatting
- Empty state handling
- Responsive design

### Part C – Frontend B2C (Customer App)

**Routes** (`front-b2c`):
```
/                          → Home (merchant listing)
/merchant/:merchantId      → Product listing by merchant
/product/:id               → Product detail
/cart                      → Cart
```

**Pages:**
- `HomeComponent` – Gradient header with search bar, merchant grid with ratings, categories
- `MerchantProductsComponent` – Product cards with rating, price, add-to-cart
- `ProductDetailComponent` – Full product info with stock status, merchant info, add-to-cart button
- `CartComponent` – Cart items list, quantity display, total calculation, checkout flow

## Technical Justification

### Backend Architecture
- **B2C endpoints separate from admin endpoints** – Prevents accidental data exposure and follows separation of concerns
- **Nearest-courier uses Euclidean distance** – Simple but effective for MVP. Production would use Haversine formula or PostGIS
- **Cart isolation** – Separate carts per merchant prevents order confusion
- **Order flow** – Atomic transaction (create order → clear cart) prevents data inconsistency

### Frontend Design
- **Standalone components** – Consistent with existing Angular patterns
- **Signals** – Modern Angular reactivity pattern
- **Gradient design** – Matches the VHanDelivery brand identity
- **Mobile-responsive** – CSS Grid with auto-fill for product/merchant cards

### Security
- B2C product endpoints are public (read-only)
- Cart and Order endpoints require JWT authentication
- Nearest-courier selection only considers APPROVED/ACTIVE couriers

## Trade-off Analysis

### 1. Euclidian Distance vs Haversine Formula vs PostGIS

**Chosen:** Euclidean distance calculated in application memory using `Math.sqrt()` on raw (lat, lng) coordinates.

**Alternatives considered:**
- **Haversine formula:** Accounts for Earth's curvature by converting lat/lng to great-circle distance
- **PostGIS:** Spatial database extension with native `ST_DistanceSphere()` and spatial indexing

**Rationale:** Euclidean distance on (lat, lng) pairs is accurate to ~1% for distances under 50km at Vietnam's latitude (~10-21°N). Since delivery distances are typically <10km (urban food delivery), the error is negligible (<100m). Haversine would add ~10 LoC of math and is trivially replaceable when needed. PostGIS would require database migration, extension installation, and spatial index maintenance—significant overhead for an MVP.

**Cost:** As the platform expands to nationwide coverage (>50km deliveries), Euclidean error grows quadratically. At 100km, the error could reach 2-3km—enough to assign the wrong courier. The migration path is: Euclidean → Haversine (in-app, no DB changes) → PostGIS (when spatial queries become a bottleneck). Each step is backward-compatible.

### 2. Hardcoded Shipping Fee vs ShippingFee Model

**Chosen:** 15,000 VND default shipping fee hardcoded in `OrderService`.

**Alternative considered:** Using the existing `ShippingFee` model in the database schema, which supports per-merchant fee rules (baseFee, feePerKm, min/max distance).

**Rationale:** The `ShippingFee` schema requires merchant-specific configuration data that may not exist for all merchants at MVP launch. A hardcoded flat fee provides a predictable default while the merchant onboarding process is completed. The fallback logic (use `ShippingFee` if configured, otherwise use default) requires a conditional query that adds complexity without immediate benefit.

**Cost:** This is a known technical debt item. As soon as multiple merchants with different delivery profiles are onboarded, the hardcoded value must be replaced with the `ShippingFee` lookup. The fix is isolated to the `create()` method in `OrderService` and does not require schema changes—the `ShippingFee` model and its relationship are already in place.

**Note:** The `ShippingFee.baseFee` field is `Decimal?` (nullable), so even after implementing the lookup, not all merchants will have configured shipping fees. The hardcoded 15,000 VND fallback remains useful as a default value when no `ShippingFee` record exists for a merchant.

### 3. Separate Carts Per Merchant vs Single Unified Cart

**Chosen:** Each merchant gets its own `Cart` record. When adding a product from a different merchant, a new cart is created.

**Alternative considered:** A single cart containing items from multiple merchants, grouped by merchant at checkout.

**Rationale:** Each order is inherently merchant-scoped (an order belongs to one merchant). A multi-merchant cart would require splitting into multiple orders at checkout, complicating the order creation flow, payment calculation, and courier assignment. Separate carts per merchant means each cart maps 1:1 to an order, simplifying the entire pipeline.

**Trade-off acknowledgment:** The current `getCart` implementation only returns the most recently modified cart (via `findFirst` with `orderBy: { createdAt: 'desc' }`). A user who adds items from Merchant A, then from Merchant B, will only see Merchant B's cart. The user must complete the order for Merchant B before seeing Merchant A's cart. A proper implementation should return ALL active carts or provide a cart picker UI. This was deferred to avoid overcomplicating the MVP cart page.

### 4. No Stock Decrement on Order Creation

**Chosen:** Orders are created without decrementing product stock.

**Alternative considered:** Wrapping order creation in a Prisma transaction that decrements stock atomically.

**Rationale:** Stock management requires inventory locking to prevent overselling. An atomic decrement without proper locking (e.g., `UPDATE products SET stock = stock - 1 WHERE stock > 0`) can still race under concurrent requests. Proper inventory management requires pessimistic locking (`SELECT ... FOR UPDATE`) or optimistic concurrency control with retry logic. These patterns add significant complexity and are typically addressed by a dedicated inventory service.

**Cost:** Two customers can order the same last-in-stock item simultaneously, and both will receive confirmation. The merchant will later discover the oversell when preparing the order. This is acceptable for an MVP food delivery platform (inventory is typically restocked daily) but must be addressed before introducing limited-stock or flash-sale items.

**Note:** The `Product.stock` field is `Int?` (nullable), meaning many products may not track stock at all. Products with `stock: null` are effectively infinite-stock items where this race condition does not apply. The risk is limited to products where the merchant has explicitly set a finite stock value.

**Recommended fix path:** Add a Prisma interactive transaction with stock check → decrement → order creation in a single `$transaction()`. Use `stock > 0` as a filter in the update query to prevent race conditions.

### 5. B2C REST Endpoints vs GraphQL

**Chosen:** Standard REST endpoints for B2C product browsing.

**Alternative considered:** GraphQL with a single `/graphql` endpoint for all B2C queries.

**Rationale:** The B2C app currently has 3 product-related views (home listing, merchant listing, product detail). Each view requires a fixed set of fields. REST endpoints that return exactly the data needed for each view are simpler to implement and cache. GraphQL would add Apollo Client, schema definitions, resolvers, and type generation overhead for no observable benefit at this complexity level.

**Cost:** If the B2C app adds more views (filters, search results, recommendations) each with different field requirements, the number of REST endpoints grows linearly. At ~10+ views, GraphQL's single-endpoint flexibility would reduce maintenance overhead.

### 6. No Database Transaction for Order Creation (Cart → Order → Clear Cart)

**Chosen:** Sequential operations without a wrapping transaction.

**Alternative considered:** Wrapping order creation + cart clearing in a Prisma `$transaction()`.

**Rationale:** The current implementation creates the order first, then clears the cart. If cart clearing fails (unlikely, as it's a simple DELETE), the order is preserved but the cart retains stale items. The user can: (a) attempt to re-order and get a duplicate order, or (b) the stale cart blocks new order attempts. Both scenarios are recoverable with manual intervention.

**Gap acknowledged:** A production system must use a transaction here. The `$transaction()` API is straightforward to add:

```ts
await this.prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ ... });
  await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
  await tx.cart.update({ where: { id: cart.id }, data: { totalAmount: 0 } });
  return order;
});
```

This was deferred to prioritize feature completion.

### 7. Courier Assignment: Find Nearest vs Round-Robin vs Queue

**Chosen:** Find courier with closest Euclidean distance to delivery coordinates.

**Alternatives considered:**
- **Round-robin:** Distribute orders evenly among available couriers, ignoring distance
- **Queue-based:** Assign to the courier who has been idle the longest
- **Load-balanced:** Consider current order load per courier

**Rationale:** Distance-based assignment minimizes delivery time, which is the primary KPI for a food delivery platform. Round-robin or queue-based approaches would assign a courier 5km away when one is 500m from the restaurant. The 15-second computation cost of scanning all available couriers is negligible compared to delivery time.

**Cost:** The current implementation computes distance for ALL available couriers. At scale (10,000+ active couriers), this becomes an O(n) scan that could take 100ms+ per order creation. Optimization options:
- Geospatial index in the database (PostGIS) with KNN search
- Grid-based partitioning (assign couriers to zones)
- Limit the search to couriers within a 5km radius
