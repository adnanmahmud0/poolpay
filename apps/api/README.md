# 🏦 POOLPAY Backend Server

A high-performance, fintech-grade backend system designed for **Community Savings Groups** (ROSCA/Esusu/Ajo). Built with Node.js, TypeScript, and MongoDB, this platform ensures total database consistency through **Mongoose Transactions**, high performance via **Advanced Indexing**, and full administrative control through a comprehensive **Super Admin Dashboard API**.

---

## 🌟 Key Pillars of the System

### 1. 🛡️ Transactional Integrity (ACID)
All critical financial operations are wrapped in **Mongoose Session-based Transactions**. This prevents partial writes and ensures that if any part of a multi-step process fails (e.g., payment succeeds but revenue log fails), the entire operation rolls back.

### 2. ⚡ Performance Optimization
Designed for scale using **Advanced MongoDB Indexing**:
- **Compound Indexes**: Optimized for Cron Jobs (`status + dueDate`), Chat History (`groupId + createdAt`), and Notifications (`userId + isRead`).
- **Searchable Hashing**: Phone numbers are stored as SHA-256 hashes (`phoneHash`) for lightning-fast lookups during dual authentication without compromising encryption.

### 3. 🔄 Dynamic Late-Joiner Support
- **Automatic Recalculation**: When a user joins an active group, the system dynamically regenerates all future turns and payments.
- **Surplus Redistribution**: Late joiners pay full contributions but receive payouts adjusted for missed cycles. This surplus is automatically redistributed as a bonus to previous winners, ensuring mathematical fairness for all members.

### 4. 🛡️ Secure Authentication (Dual-Method)
- **Email & Phone Login**: Supports authentication via email address or hashed phone number.
- **Split Name Support**: Standardized user profiles with `firstName` and `lastName`.
- **6-Digit verification**: All verification systems (Email, 2FA, Reset) use high-entropy **6-digit codes**.
- **Multi-Channel 2FA**: Support for both **Twilio SMS** and **Email** OTP for registration and high-risk actions.

### 5. 🎖️ Membership Tiers (GUEST, REGULAR, VIP)
- **Feature Gating**: Tier-based restrictions for group creation and Stripe onboarding.
- **Subscription Lifecycle**: Automatic handling of upgrades, scheduled downgrades, and grace periods (7 days) via Stripe Webhooks.
- **Tier Limits**:
    - **GUEST**: Join groups only, no creation.
    - **REGULAR**: Max 1 active group, eligible for commissions.
    - **VIP**: Unlimited group creation, eligible for commissions.

### 6. 📁 Crash-Proof & Multi-Platform Storage System (Cloudinary)
To guarantee 100% uptime and seamless file uploads (such as high-resolution profile images or payment receipts) across different operating systems (Windows, Linux) and runtime environments (Node.js, Bun), the storage provider utilizes a robust, unified upload pipeline:
- **Base64 Upload Streamlining**: Avoids unhandled file read-stream crashes and `undefined` file buffer hazards by converting uploaded local disk files into standard Base64 Data URIs before uploading them to Cloudinary.
- **Cross-Platform Path Compatibility**: Solves all Windows-specific absolute/relative path escaping issues and Bun multipart compatibility bugs.
- **Strict Environment Normalization**: Implements runtime string trimming to eliminate hidden Windows carriage returns (`\r`) from credentials, combined with dynamic `CLOUDINARY_URL` environment variable injection for automatic, correct request signing.
- **Error Shielding**: Includes error event listeners on all buffer streams to catch failures gracefully and prevent any unhandled promise rejections from crashing the server.

---

## ✨ Core Features

### 👥 Group Lifecycle & Activation
- **Manual Start Restriction**: Groups **cannot** be started until the required member count is reached.
- **Activation Check**: When starting a group, the system validates that **every** active member has a verified Stripe account and at least one payment method.
- **Start-Date Monitoring**: If a group's `startDate` arrives but it's not full, the system automatically enqueues notifications to the creator, members, and admins to advise manual intervention.

### 💰 Advanced Financial Analytics & Auditing
- **Split Payouts**: Support for **Creator Commissions** (capped at 1%) alongside platform fees (1%).
- **Isolated Transfers**: Creator commissions are treated as independent transfers to ensure member payouts are never blocked by secondary failures.
- **Centralized Audit Log**: Every sensitive state transition (membership change, payout retry, etc.) is recorded for total auditability.

### 🔔 Robust Notification System (Queue-Based & Real-Time)
- **Decoupled Architecture**: All Push, Email, and SMS notifications are offloaded to **BullMQ & Redis**. This ensures that slow third-party providers (Twilio/Firebase/SendGrid) never block the main application flow.
- **Crash-Proof Queuing**: All queue insertions are wrapped in fail-safes. If the Redis queue server goes offline, the system gracefully logs the error without crashing the API or failing the primary database transaction.
- **Auto-Retry & Exponential Backoff**: Background notification workers automatically retry failed deliveries (up to 3 times) with exponential backoff delays, ensuring robust message delivery even during temporary third-party API outages.
- **Real-Time Delivery**: Integrated **Socket.IO** to deliver instant in-app alerts (e.g., late fees, group status changes, transaction flags) directly to connected clients.
- **Smart Reminders**: Payment reminders are sent exactly once on critical milestones (Due Date, Day 3, and Day 5) to ensure high compliance without spamming users.

### 📢 Advertisement System
- **Timed Campaigns**: Admins can schedule advertisements with start/end dates and priority levels.
- **Active Filtering**: The frontend only receives ads that are currently active and within their scheduled timeframe.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB (Mongoose) - `poolpay-savings-app-db`
- **Background Jobs**: BullMQ & Redis
- **Payments**: Stripe Connect (Express) & Stripe Subscriptions
- **SMS & Auth**: Twilio
- **Notifications**: Firebase Cloud Messaging (FCM)

---

## 🚀 Getting Started

### 1. Prerequisites
- **MongoDB**: Replica Set required for Transactions.
- **Redis**: For BullMQ.
- **Stripe**: Account with Connect and Billing enabled.
- **Twilio**: For SMS OTP.

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure your environment variables.

#### 🔒 Strict Environment Validation
To ensure the server never starts in a misconfigured or insecure state, the application implements a strict **Environment Validator** at startup.

If any of the following **critical required environment variables** are missing, empty, or using default placeholder values (e.g. `your_...`), the server will print a clear warning box detailing the missing keys and exit immediately with status code `1`:

1. **DATABASE_URL**: MongoDB Connection URL (Replica Set required for Mongoose Transactions).
2. **JWT_ACCESS_SECRET**: Secret key for signing JWT Access Tokens.
3. **JWT_REFRESH_SECRET**: Secret key for signing JWT Refresh Tokens.
4. **SUPER_ADMIN_EMAIL**: Initial email used to seed the Super Admin account.
5. **SUPER_ADMIN_PASSWORD**: Initial password used to seed the Super Admin account.

Other optional and module-specific environment variables (e.g. Stripe, Twilio, Cloudinary, AWS) will also undergo standard schematic validation based on their types and structures.


### 4. Automated System Alerting
The system includes a structured alerting utility (`alerting.ts`) that dispatches critical alerts (payout failures, stuck queues, infrastructure issues) to:
- **Winston Logs**: Local file and console logging.
- **Slack**: Dedicated channels via Incoming Webhooks (if configured).
- **Sentry**: Error tracking and performance monitoring.

### 3. Running the Application
```bash
# Development mode
npm run dev

# Build and Production mode
npm run build
npm start
```

---

## 📂 API Reference (New & Critical Endpoints)

### 👤 Authentication & Membership
- `POST /api/v1/auth/verify-2fa` - Verify multi-channel OTP.
- `POST /api/v1/membership/subscribe` - Initiate checkout for REGULAR/VIP.
- `GET /api/v1/membership/status` - Get current tier and subscription status.
- `PATCH /api/v1/membership/toggle-auto-renew` - Manage subscription renewal.

### 👥 Group & Commission
- `POST /api/v1/groups` - Create group (Accepts `creatorCommissionPercent` for Regular/VIP).
- `GET /api/v1/groups/:id/start` - Activate group (Membership-gated).

### 💰 Admin & Oversight
- `GET /api/v1/admin/audit-logs` - View system-wide security and financial logs.
- `POST /api/v1/advertisements` - Manage advertisement campaigns.
- `POST /api/v1/admin/payouts/:id/retry` - Manually resolve failed payouts/commissions.

---

## 🤝 Support & License
Proprietary software for the POOLPAY Community.
