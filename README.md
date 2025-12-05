# 🚀 VHANIT DELIVERY (deliveryK)
Dự án này là một **Monorepo** được xây dựng bằng **Nx**, sử dụng kiến trúc **Microfrontend (Angular)** cho Frontend và **Microservices (NestJS)** cho Backend.  
→ 이 프로젝트는 **Nx** 기반의 **모노레포(Monorepo)** 구조로 구축되었으며, 프론트엔드는 **마이크로 프런트엔드(Angular)**, 백엔드는 **마이크로서비스(NestJS)** 아키텍처를 사용합니다.

Mục tiêu quan trọng là đồng bộ hóa công cụ kiểm thử **Vitest** trên toàn bộ dự án.  
→ 주요 목표는 프로젝트 전반에서 테스트 도구 **Vitest**를 통일하여 사용하도록 하는 것입니다.
---

## 🛠️ I. Thiết Lập Môi Trường (Setup)
→ 🛠️ I. 환경 설정 (Setup)

### 1. Yêu cầu tiên quyết  
→ 1. 필수 요구사항

- **Node.js:** Phiên bản 18+  
→ **Node.js:** 18 버전 이상

- **npm:** Phiên bản mới nhất  
→ **npm:** 최신 버전

- **Nx CLI:** Cài đặt toàn cục nếu chưa có  
→ **Nx CLI:** 미설치 시 전역(Global)으로 설치 필요

```bash
npm install -g nx

### *** Cài đặt Dependencies  
→ *** Dependencies 설치

- Vì dự án có xung đột phiên bản giữa Vitest và các gói Angular/AnalogJS (ERESOLVE), cần sử dụng cờ `--legacy-peer-deps`.  
→ 이 프로젝트는 Vitest와 Angular/AnalogJS 패키지 간 버전 충돌(ERESOLVE)이 발생하므로 `--legacy-peer-deps` 옵션을 반드시 사용해야 합니다.

#### # Cài đặt tất cả các plugin Nx cần thiết  
→ # 필요한 Nx 플러그인 전체 설치

# Cài đặt các dependencies khác và giải quyết xung đột
- npm install --legacy-peer-deps

II.   Lệnh Chạy                    Build                                          Ghi chú
Mục tiêu	                                                                          
Start       Frontend	 nx serve frontend-shell	                  Khởi động ứng dụng Angular (Microfrontend Host)
Start       Backend	     nx serve api-service	                      Khởi động máy chủ NestJS
Test        Frontend	 nx test frontend-shell	                      Chạy kiểm thử Vitest cho Frontend
Test        Backend	     nx test api-service	Chạy                  kiểm thử Vitest cho Backend
Build       Frontend	 nx build frontend-shell	                  Build ứng dụng Angular
Build       Backend	     nx build api-service	                      Build ứng dụng NestJS