# VhanDelivery - Hướng dẫn chạy project local

Monorepo gồm backend NestJS (`api-service`), storefront B2C (`front-b2c`), admin panel (`front-management`) và thư viện dùng chung (`shared`).

## Yêu cầu

- **Node.js** 20.x (khuyến nghị LTS)
- **npm**
- **Docker Desktop** (PostgreSQL + MinIO chạy bằng Docker)

## Cài đặt lần đầu

```bash
# Clone repo và vào thư mục project
cd Interview

# Cài dependencies
npm install

# Tạo file env local (nếu chưa có)
# Sao chép .env.example → .env.development và chỉnh nếu cần
```

File `.env.development` mặc định đã cấu hình:

- PostgreSQL: `localhost:5432` - user/pass `admin` / `admin`
- API: `http://localhost:3000`
- MinIO: `http://localhost:9000` - `minioadmin` / `minioadmin`

## Chạy project (3 terminal)

### Terminal 1 - Database + Backend API

```bash
docker compose up -d postgres minio createbuckets
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

npx nx serve api-service
```

API chạy tại: **http://localhost:3000**

### Terminal 2 - Storefront B2C

```bash
npx nx serve front-b2c --port=4200
```

B2C chạy tại: **http://localhost:4200**

### Terminal 3 - Admin Management

```bash
npx nx serve front-management --port=4300
```

Admin panel chạy tại: **http://localhost:4300**

## Tổng quan URL

| Service            | URL                      | Ghi chú                          |
|--------------------|--------------------------|----------------------------------|
| API                | http://localhost:3000    | NestJS backend                   |
| B2C Storefront     | http://localhost:4200    | Cửa hàng cho khách hàng          |
| Admin Management   | http://localhost:4300    | Quản trị hệ thống                |
| MinIO Console      | http://localhost:9001    | Upload ảnh sản phẩm              |
| PostgreSQL         | localhost:5432           | DB `vhandelivery_db`             |

Frontend dev server proxy `/api` → `http://localhost:3000`, không cần cấu hình CORS thêm khi chạy local.

## Tài khoản demo

Sau `npx prisma db seed`, dùng các tài khoản sau:

| Vai trò          | URL đăng nhập              | Email                    | Mật khẩu     |
|------------------|----------------------------|--------------------------|--------------|
| **Platform Admin** | http://localhost:4300      | `admin@vhandelivery.com` | `admin123`   |
| Agency Owner     | http://localhost:4300      | `agency@demo.vn`         | `agency123`  |
| Merchant Owner   | http://localhost:4300      | `merchant@demo.vn`       | `merchant123`|
| Customer (B2C)   | http://localhost:4200      | `customer@demo.vn`       | `customer123`|

Tài khoản bổ sung (seed demo):

- Courier online: `courier.online@demo.vn` / `courier123`
- Courier chờ duyệt (trang `/users/couriers`): `courier.pending@demo.vn` / `courier123`

## Một số lệnh hữu ích

```bash
# Xem dữ liệu DB qua Prisma Studio
npm run db:studio

# Chạy test API
npm run test:api-service

# Dừng Docker services
docker compose down
```

## Xử lý lỗi thường gặp

**Port đã được sử dụng (4200 / 4300 / 3000)**

- Tìm và dừng process đang chiếm port, hoặc đổi port khi serve:
  ```bash
  npx nx serve front-b2c --port=4201
  npx nx serve front-management --port=4301
  ```

**Lỗi kết nối database**

- Kiểm tra Docker đang chạy: `docker compose ps`
- Khởi động lại Postgres: `docker compose up -d postgres`

**Lỗi upload ảnh (MinIO)**

- Đảm bảo `createbuckets` đã chạy và credentials trong `.env.development` khớp `minioadmin` / `minioadmin`

**Seed / migrate lỗi**

- Chạy lại theo thứ tự: `npx prisma generate` → `npx prisma migrate deploy` → `npx prisma db seed`

## Cấu trúc project

```
api-service/          # NestJS API
front-b2c/            # Angular storefront (khách hàng)
front-management/     # Angular admin panel
front-b2b/            # Angular B2B (đăng ký đối tác)
shared/               # Interfaces, services, UI dùng chung
prisma/               # Schema, migrations, seed data
```

## Tài liệu bài làm

- `TASK1_EXPLAIN.md` - Courier module
- `TASK2_EXPLAIN.md` - Courier admin UI
- `TASK3_EXPLAIN.md` - Product, cart, order, B2C storefront


## Cậu lệnh test 1 round

- npx nx test api-service
- npx nx test front-management
- npx nx build api-service
- npx nx build front-management
- npx nx build front-b2c