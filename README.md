# VhanDelivery Hiring Assignment

This repository contains the completed VhanDelivery hiring assignment in an Nx monorepo with a NestJS backend, Angular management and storefront applications, shared frontend contracts, Prisma schema and migrations, and submission notes for all three tasks.

## Assignment Scope

- Task 1: code review and critical production issue analysis
- Task 2: courier registration, approval workflow, and management review flow
- Task 3: product management, B2C storefront, and order creation flow

Detailed write-ups are available in:

- `TASK1_EXPLAIN.md`
- `TASK2_EXPLAIN.md`
- `TASK3_EXPLAIN.md`

## Workspace Overview

- `api-service`: NestJS API with Prisma
- `front-management`: Angular management application
- `front-b2c`: Angular customer storefront
- `front-b2b`: Angular B2B frontend
- `shared`: shared frontend interfaces, pipes, and services
- `prisma`: schema, migrations, and seed script

## Main Deliverables

- Security review notes and remediation guidance for the existing platform
- Courier OTP registration and admin approval flow across DB, API, and management UI
- Product management flow with typed shared contracts
- B2C catalog, product detail, cart, and checkout flow
- Nearest-courier assignment for order creation with a safe fallback strategy
- Drag-and-drop product image uploads in the management UI

## Local Setup

### Prerequisites

- Node.js 20+
- npm
- Docker with `docker compose`

### Install dependencies

```bash
npm install
```

### Start local infrastructure

The Docker stack uses `docker-compose.yml` and reads `.env.development` by default.

```bash
docker compose up -d
```

This starts:

- PostgreSQL
- MinIO
- MinIO bucket bootstrap job

## Run Applications Locally

### Backend

```bash
npm run start:api-service
```

This runs Prisma generate, applies local migrations with `prisma migrate dev`, and starts the API.

### Management frontend

```bash
npm run start:front-management
```

### B2C frontend

```bash
npm run start:front-b2c
```

### B2B frontend

```bash
npm run start:front-b2b
```

## Validation Commands

Commands used to validate the delivered work:

```bash
npx nx test api-service --runInBand
CI=1 npx nx build api-service --configuration=production --skip-nx-cache --output-style=static
CI=1 npx nx build front-management --configuration=production --skip-nx-cache --output-style=static
npx nx test front-b2c --runInBand
CI=1 npx nx build front-b2c --configuration=production --skip-nx-cache --output-style=static
```

## Reviewer Notes

- The management UI and B2C app proxy API requests to the local backend during development.
- Local image upload support relies on the Docker MinIO service being available.
- The three `TASK*_EXPLAIN.md` files describe the delivered scope, technical decisions, and validation details for each task.
