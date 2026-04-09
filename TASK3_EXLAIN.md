# TASK 3: MERCHANT PRODUCT FLOW & B2C SYSTEM ARCHITECTURE

## A. Backend Requirements

### 1. Merchant Authorization & Product Security

- **Strict Validation:** Before any product is created, the system verifies two conditions:
  1. The User must have the `MERCHANT_OWNER` role.
  2. The associated Merchant profile must have an `APPROVED` status.
- **Data Isolation:** Implemented ownership checks to ensure a Merchant can only modify products belonging to their own `merchantId`, preventing ID-traversal attacks.

- **Location:** product.service (create).

### 2. Product Lifecycle Management

- **Status Flow:** Introduced `DRAFT`, `PUBLISHED`, and `ARCHIVED` statuses to give Merchants control over visibility.
- **Scalability:** Integrated Offset-based pagination (`skip`, `take`) for product listings to ensure performance as inventory grows.
- **Location:** product.service (findAllByMerchant, findProductByMerchant).

### 3. Smart Courier Dispatch (Matching Logic)

The order creation flow triggers an automated courier selection process:

- **Eligibility:** Filters for couriers who are `APPROVED` (vetted) AND `ONLINE` (available).
- **Proximity:** Implementation of the Haversine formula to calculate the distance between the Merchant's location and the Courier's last known coordinates.
- **Location:** courier.service (findNearestCourier)

---

## 4. Database Optimization

- **Indexing:** Added `@index` on `Product(status, merchantId)` and `Courier(approvalStatus, operationalStatus)` to optimize real-time filtering.
- **Soft Delete:** Applied to both Products and Orders to maintain audit trails.
- **Location:** schema.prisma (line 440, 533)

---

## 5. B2C Storefront Integration

- **Customer View:** The B2C API only retrieves products with `PUBLISHED` status from `APPROVED` merchants.
- **Order Flow:** Transactional integrity ensured using Prisma `$transaction` to handle order creation and courier assignment simultaneously.
- **Location:** order.service(createOrder)

### 6. Order Granularity (OrderItem Implementation)

- **Nested Object Creation:** Leveraged Prisma's nested write capability to maintain atomicity between the `Order` and its `OrderItems`.
- **Price Integrity:** Calculations for line-item totals (`price * quantity`) are performed server-side to prevent client-side price manipulation.
- **Support for Variants:** The system architecture is future-proofed by supporting `variantId`, allowing for complex product structures (e.g., sizes, flavors, or add-ons).
- **Location:** order.service(createOrder)

### 7. Full‑text search capability

- **Keyword Suggestion**: As the user types, the system fetches simple matches to provide instant feedback.
- **Product Search**: Once the user selects a specific keyword or submits the query, the system performs a high-accuracy search using PostgreSQL Trigram similarity.
- **Location:** production.service (getSuggestions, searchProducts)
