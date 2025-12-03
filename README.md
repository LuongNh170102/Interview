# 🚀 VHÂN DELIVERY (deliveryK)

Dự án này là một **Monorepo** được xây dựng bằng **Nx**, sử dụng kiến trúc **Microfrontend (Angular)** cho Frontend và **Microservices (NestJS)** cho Backend. Mục tiêu quan trọng là đồng bộ hóa công cụ kiểm thử **Vitest** trên toàn bộ dự án.

---

## 🛠️ I. Thiết Lập Môi Trường (Setup)

### 1. Yêu cầu tiên quyết

- **Node.js:** Phiên bản 18+
- **npm:** Phiên bản mới nhất
- **Nx CLI:** Cài đặt toàn cục nếu chưa có:
```bash
npm install -g nx

 *** Cài đặt Dependencies

- Vì dự án có xung đột phiên bản giữa Vitest và các gói Angular/AnalogJS (ERESOLVE), cần sử dụng cờ --legacy-peer-deps:

# Cài đặt tất cả các plugin Nx cần thiết
- npm install -D @nx/angular @nx/node @nx/nest @nx/vite --legacy-peer-deps

# Cài đặt các dependencies khác và giải quyết xung đột
- npm install --legacy-peer-deps

II.   Lệnh Chạy                              Build
Mục tiêu	             Lệnh chạy	                                                                 Ghi chú
Start       Frontend	 nx serve frontend-shell	                  Khởi động ứng dụng Angular (Microfrontend Host)
Start       Backend	     nx serve api-service	                      Khởi động máy chủ NestJS
Test        Frontend	 nx test frontend-shell	                      Chạy kiểm thử Vitest cho Frontend
Test        Backend	     nx test api-service	Chạy                  kiểm thử Vitest cho Backend
Build       Frontend	 nx build frontend-shell	                  Build ứng dụng Angular
Build       Backend	     nx build api-service	                      Build ứng dụng NestJS