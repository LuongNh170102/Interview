# Task 3

## Part A – Backend Requirements

### Merchant must have APPROVED status before creating products

<!-- Upon inspection in the ProductController I found out that there is a guard that check for merchant status to be approved before creating products, which is ResourceStatusGuard -->

### API must validate that the user role is MERCHANT_OWNER

<!-- Upon inspection in the ProductController I found out that inside @Body there is a pipe called MerchantOwnershipPipe, inside it there is a method called validatePermission wihch query from user_roles table to find both the user and the MERCHANT_OWNER role -->

### Merchant Owners can only create products for their own store

<!-- This one hasn't been implemented yet so I decided to implement it inside of MerchantOwnershupPipe as well to retain readability and project's structure, I added this code, this will make sure that the current logged in user and the merchant that they are trying to create the product under exists, if it does then it mean they are the owner -->
```ts
// Merchant Owners can only create products for their own store
const isOwner = await this.prisma.merchant.findFirst({
    where: { id: internalMerchantId, ownerId: user.userId }
})

if (!isOwner) {
    throw new ForbiddenException(PRODUCT_MESSAGES.PERMISSION_DENIED_CREATION);
}
```

### Implement pagination for product listing APIs

<!-- I did extend pagination in ProductQueryBuilder for product list by reusing the code from other QueryBuilder as well as reusing other Entity and turn them into ProductEntity -->

### Implement logic for selecting the nearest courier during order creation & Only couriers with status APPROVED and ONLINE are eligible

<!-- I created orders endpoint for users to place order (when order is place it will calculated each product price and add to order items, after sucess order will be created in a transaction, when order is placed it will attempt to find the nearest courier to the order's delivery address once) and fetch order list but it is still simple -->
<!-- as state above I'm using PostGIS, however prisma currently doesn't support spatial data types and indexes I had to create them manually as well as use raw query string in OrderService findNearestCourier method I try to get the nearest courier to the order's delivery address with the parameter as the order's delivery latitude and longtitude -->

<!-- In the raw query i also check for both the courier approval status to be APPROVED and activeStatus to AVAILABLE (equivalent to ONLINE) -->

<!-- I also added these columns to Order schema, these will be important if we ever need to expand the system to automatically find the closest courier and assign them to the order by listening on a websocket or a SSE -->
// add geo columns for implementing PostGIS  
deliveryLat     Float?   @map("delivery_lat")
deliveryLng     Float?   @map("delivery_lng")

### Add product status: DRAFT / PUBLISHED / ARCHIVED

<!-- I added the status column in Product prisma schema with along with ProductStatus enum for data type consistency across DB and BE, FE -->
enum ProductStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

status      ProductStatus     @default(DRAFT) @map("staus") // DRAFT / PUBLISHED / ARCHIVED

### Add full‑text search capability

<!-- I added ProductQueryBuilder for product list to follow other QueryBuilder pattern which is creation date, text search on name (because name is json i have to search by each key) and sku, price range, status -->

### PostGIS for efficient courier selection

<!-- I decided to use PostGIS because it is simple to implement and separate itself from the backend server, the calculations for the closest courier location to order's delivery address won't happen on the server but rather on the database itself, sharing some of the server's load, while the haversine formula requires the to be calculated on the server, causing extra load for the server and might even effect user experience as the system scale up, so in the long term when the system scale up with more users & bigger codebase, If we want to switch to PostGIS it would be harder by then, that's why it's better to use the best optimized method now than later -->

<!-- PostGIS is a spatial database and because it uses spatial indexes, spatial data, spatial function, it can query shortest location between 2 points in O(log(N)) time instead of O(N) time too further optimizing database performance -->

<!-- To use PostGIS i had to replace postgre image in docker-compose.yml with postgis/postgis:15-3.4 because that is the database with spatial support -->

- Prisma cannot create geography type, so I have to manually run these SQL queries

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Courier location
ALTER TABLE couriers ADD COLUMN location geography(Point, 4326);

-- Order delivery location
ALTER TABLE orders ADD COLUMN delivery_location geography(Point, 4326);

-- Index for fast nearest search
CREATE INDEX courier_location_idx ON couriers USING GIST(location);
CREATE INDEX order_location_idx ON orders USING GIST(delivery_location);
```

**There are so many more features i want to implements but because of the time constraint of 2.5 days I only managed to do this, I decided to not do the front-end for product creation & order placement because without a secure back-end any front-end are just as vulnerible**