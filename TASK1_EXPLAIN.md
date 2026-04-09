# TASK 1: SECURITY & ARCHITECTURE AUDIT REPORT

## 1. Executive Summary

The current system contains several critical security vulnerabilities related to OAuth2 authentication mechanisms and session management. Additionally, the database schema is not optimized for the practical operational workflows required for Couriers.

---

## 2. Identified Issues

### Issue 1: Sensitive Data Exposure via URL (Critical)

- **Location:** `auth.controller.ts` | `googleAuthCallback` (L156) & `kakaoAuthCallback` (L254).
- **Description:** The `access_token` is directly attached to URL Query Parameters during the redirect to the Frontend.
- **Impact:** Tokens are stored in **Browser History** and **Server Logs**. If the device is shared or compromised by XSS malware, attackers can easily hijack the user's account.

### Issue 2: Host Header Injection (Major)

- **Location:** `auth.controller.ts` | `getFrontendUrlFromHost` (L47-52).
- **Description:** The system implicitly trusts the `Host` header from the request to generate redirect links.
- **Impact:** An attacker can spoof the Host header to redirect users (along with their tokens) to a malicious site (`hacker.com`).

### Issue 3: Missing CSRF Protection (Critical)

- **Location:** `auth.controller.ts` | `logout` (L82) & `refresh` (L95).
- **Description:** State-changing endpoints (POST) lack mechanisms to prevent Cross-Site Request Forgery.
- **Impact:** Users could be forced to log out or refresh tokens unintentionally when visiting malicious third-party websites.

### Issue 4: Incomplete Business Logic Schema (Major)

- **Location:** `prisma/schema.prisma` | Model `Courier` (L450).
- **Description:** Missing fields essential for the approval workflow (`approvalStatus`, `rejectionReason`) compared to the `Agency` model.
- **Impact:** The administrator cannot perform the vetting process for new couriers, violating the delivery system's business requirements.

### Issue 5: Missing Database Indexes (Performance)

- **Location:** `prisma/schema.prisma` | Model `Order` (L524) & `Courier` (L450).
- **Description:** Fields such as `status`, which are frequently used for data filtering, are not indexed.
- **Impact:** As the dataset grows, operations to find orders or locate the nearest courier will cause severe system lag due to Full Table Scans.

### Issue 6: Insecure Primary Key Strategy (Major)

- **Location:** All Models (`User`, `Order`, `Product`, `Courier`) in `schema.prisma`.
- **Description:** The system uses auto-incrementing Integers (`Int`) for primary keys as the sole identifier in public-facing APIs.
- **Impact:** - **ID Enumeration Attacks:** Competitors or malicious users can scrape the entire database by simply incrementing IDs in API requests (e.g., `/orders/1`, `/orders/2`).
  - **Business Intelligence Leak:** It exposes business volume (e.g., a customer can see their Order ID is `100`, revealing the platform has only handled 100 orders).
  - **Scaling Limitations:** Integer IDs make it difficult to merge databases or implement sharding in the future compared to UUIDs.

---

## 3. Recommendations & Solutions

1. **Secure Authentication:** Transition to using **Secure HttpOnly Cookies** or the **PostMessage API** for Access Token transmission.
2. **Domain Whitelisting:** Restrict redirects to a pre-configured list of allowed domains defined in environment variables.
3. **Schema Optimization:** Supplement the Prisma schema with Audit fields and `@index` annotations to optimize query performance.
4. **ID Masking & UUIDs:** Implement **UUID v4** or **ULID** for public-facing identifiers (`externalId`) while maintaining `Int` for internal database performance (Foreign Keys).
