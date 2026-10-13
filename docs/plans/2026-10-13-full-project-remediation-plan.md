# PoolPay Monorepo Full Remediation Implementation Plan

**Goal:** Systematically remediate all 95 issues (25 Critical/P0, 30 High/P1, 23 Medium/P2, 17 Low/P3) identified across `apps/backend`, `apps/admin`, `apps/klx-luxe-plus`, `apps/mobile`, `packages/*`, and DevOps/CI/CD infrastructure.

**Architecture & Approach:** Fixes are ordered by risk and dependency across 6 phases (25 atomic tasks). Phase 1 and Phase 2 secure the backend API, authentication, and financial ledger; Phase 3 aligns shared workspace packages and linting; Phase 4 fixes the Next.js web apps; Phase 5 hardens the Flutter mobile app; and Phase 6 secures Docker, Nginx SSL persistence, backups, and CI/CD pipelines.

**Tech Stack:** TypeScript, Express.js, Mongoose (MongoDB 7), BullMQ (Redis 7), Stripe SDK, Socket.IO, Next.js 16 (React 19, Tailwind v4), Flutter/Dart (GetX, Dio), Turborepo, Docker, Nginx, GitHub Actions.

---

## Phase 1: Backend Critical Startup, Auth, RBAC & Security (`apps/backend`)

### Task 1.1: Fix Production Server Startup Crash & Graceful Shutdown

- **Files:**
  - Create: `apps/backend/src/app/jobs/redistribution.worker.ts`
  - Modify: [`apps/backend/src/server.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/server.ts#L27-L115)
- **Actions:**
  1. Implement `apps/backend/src/app/jobs/redistribution.worker.ts` consuming `redistributionQueue` (`QUEUE_NAMES.REDISTRIBUTION`) to process shortfall redistribution jobs enqueued by [`turnScheduler.worker.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/jobs/turnScheduler.worker.ts#L426) and [`adjustment.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/payout/adjustment.service.ts#L38), so [`server.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/server.ts#L101) no longer crashes on startup when `DISABLE_WORKERS` is false.
  2. Update [`gracefulShutdown`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/server.ts#L27-L69) to close the HTTP `server`, Socket.IO server (`io.close()`), and all active BullMQ worker instances before closing `mongoose.connection` and `redisConnection`.

### Task 1.2: Fix Mass Assignment, Privilege Escalation & Self-KYC Verification

- **Files:**
  - Modify: [`apps/backend/src/app/middlewares/validateRequest.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/middlewares/validateRequest.ts#L4-L18)
  - Modify: [`apps/backend/src/app/modules/user/user.validation.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/user/user.validation.ts#L100-L120)
  - Modify: [`apps/backend/src/app/modules/user/user.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/user/user.service.ts#L56-L160)
  - Modify: [`apps/backend/src/app/modules/settings/settings.route.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/settings/settings.route.ts#L38-L42)
  - Modify: [`apps/backend/src/app/modules/legal/legal.route.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/legal/legal.route.ts#L13-L17)
  - Modify: [`apps/backend/src/app/middlewares/trimInput.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/middlewares/trimInput.ts#L4-L12)
- **Actions:**
  1. In [`validateRequest.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/middlewares/validateRequest.ts#L8-L12), assign parsed output back (`if (parsed.body) req.body = parsed.body; if (parsed.query) req.query = parsed.query; if (parsed.params) req.params = parsed.params;`) so unknown fields and injected MongoDB operators (`$set`, `$ne`) are stripped.
  2. In [`trimInput.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/middlewares/trimInput.ts#L4-L12), recursively trim strings and strip keys starting with `$` or containing `.`.
  3. In [`user.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/user/user.service.ts#L64-L158), require `Role.ADMIN` or `Role.SUPER_ADMIN` before allowing modifications to `kycStatus`, `role`, `status`, `membershipTier`, `subscriptionStatus`, `isVerified`, or `stripeConnectStatus`. Explicitly construct a safe `$set` object for `User.findByIdAndUpdate`.
  4. Add Zod `validateRequest` schemas to `PATCH /api/v1/settings/environment` and `PUT /api/v1/legal/:slug`.

### Task 1.3: Fix Phone Hash Mismatch, Admin 2FA Bypass, `setPassword` Takeover & OTP Security

- **Files:**
  - Modify: [`apps/backend/src/app/modules/auth/auth.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/auth/auth.service.ts#L190-L761)
  - Modify: [`apps/backend/src/app/modules/auth/auth.controller.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/auth/auth.controller.ts#L50-L65) (and lines `234-246`)
  - Modify: [`apps/backend/src/app/modules/auth/auth.validation.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/auth/auth.validation.ts#L106-L110)
  - Modify: [`apps/backend/src/app/modules/auth/auth.route.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/auth/auth.route.ts#L28-L56)
  - Modify: [`apps/backend/src/app/config/passport.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/config/passport.ts#L15-L25)
- **Actions:**
  1. Replace all plain `crypto.createHash("sha256").update(identifier).digest("hex")` calls in [`auth.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/auth/auth.service.ts#L194-L197) (`verifyEmail`, `verifyRegistrationOTP`, `resendOTP`, `verify2FA`, `forgotPassword`, `verifyResetOtp`) and [`passport.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/config/passport.ts#L17-L20) with `generatePhoneHash(identifier)` from [`phoneUtils.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/phoneUtils.ts#L28-L36).
  2. Remove the `!isDashboardLogin` 2FA bypass in [`auth.controller.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/auth/auth.controller.ts#L56-L60) and [`auth.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/auth/auth.service.ts#L463-L466) so 2FA is strictly enforced when enabled.
  3. In [`AuthServices.setPassword`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/auth/auth.service.ts#L725), query `User.findById(userId).select("+password")` so `oldPassword` is verified when a user already has a password, and align [`auth.controller.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/auth/auth.controller.ts#L238) (`req.body.newPassword || req.body.password`) with [`setPasswordZodSchema`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/auth/auth.validation.ts#L106-L110).
  4. In [`AuthServices.resetPassword`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/auth/auth.service.ts#L690-L721), clear `user.passwordResetCode = undefined` and `user.passwordResetCodeExpires = undefined` before saving, and track failed attempts.
  5. In [`AuthServices.verify2FA`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/auth/auth.service.ts#L545-L565), enforce user status (`BLOCKED`, `SUSPENDED`, `INACTIVE`) and `lockoutUntil` checks.
  6. Attach `authLimiter` to `/verify-2fa`, `/verify-email`, `/verify-registration-otp`, and `/verify-reset-otp` in [`auth.route.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/auth/auth.route.ts#L28-L56).

### Task 1.4: Fix `QueryBuilder` IDOR/ReDoS/Field Leaks, Group IDORs & Socket.IO Spoofing

- **Files:**
  - Modify: [`apps/backend/src/app/utils/QueryBuilder.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/QueryBuilder.ts#L13-L60)
  - Modify: [`apps/backend/src/app/modules/payment/payment.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/payment/payment.service.ts#L5-L20)
  - Modify: [`apps/backend/src/app/modules/transaction/transaction.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/transaction/transaction.service.ts#L121-L139)
  - Modify: [`apps/backend/src/app/modules/group/group.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/group/group.service.ts#L123-L188)
  - Modify: [`apps/backend/src/app/modules/groupMember/groupMember.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/groupMember/groupMember.service.ts#L204-L210)
  - Modify: [`apps/backend/src/app/modules/chat/chat.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/chat/chat.service.ts#L10-L40)
  - Modify: [`apps/backend/src/app/socket/chat.handler.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/socket/chat.handler.ts#L6-L48)
  - Modify: [`apps/backend/src/app/socket/socket.server.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/socket/socket.server.ts#L12-L16)
- **Actions:**
  1. In [`QueryBuilder.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/QueryBuilder.ts#L13-L60):
     - Escape regex special characters in `search()`.
     - Strip any field starting with `+` or matching sensitive field names (`password`, `twoFactorSecret`, `passwordResetCode`, `fcmToken`, `phoneHash`) in `fields()`.
     - Cap `limit` at `Math.min(Math.max(Number(this.query.limit) || 10, 1), 100)` in `paginate()`.
     - Strip `userId` from `req.query` in `getMyPayments` and `getMyTransactions` so callers cannot override their own `userId` filter.
  2. In `getGroupById`, `getGroupMembers`, and `getGroupMessages`, verify that the requesting user is either an active member of `groupId` or has an Admin role (`ADMIN`/`SUPER_ADMIN`).
  3. In [`chat.handler.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/socket/chat.handler.ts#L6-L48), verify `GroupMember` membership before `socket.join(groupId)` and before saving/emitting messages, and always set `senderId: new Types.ObjectId(socket.data.userId)` (ignoring `data.senderId`).
  4. In [`socket.server.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/socket/socket.server.ts#L12-L16), replace wildcard `"*"` CORS with the configured allowed origins list.

### Task 1.5: Fix Reflected XSS, Unrestricted File Uploads, Hardcoded Fallbacks & Exposed Debug Routes

- **Files:**
  - Modify: [`apps/backend/src/app/modules/stripe/stripe.controller.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/stripe/stripe.controller.ts#L59-L95)
  - Modify: [`apps/backend/src/app/utils/mobileRedirect.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/mobileRedirect.ts#L3-L38)
  - Modify: [`apps/backend/src/app/config/multer.config.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/config/multer.config.ts#L42)
  - Modify: [`apps/backend/src/app/utils/storage/localStorageProvider.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/storage/localStorageProvider.ts#L67-L85)
  - Modify: [`apps/backend/src/app/config/env.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/config/env.ts#L36-L38) (and lines `131-137`)
  - Modify: [`apps/backend/src/app.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app.ts#L134-L142) (and lines `198`, `227-238`)
  - Modify: [`apps/backend/src/app/modules/admin/admin.route.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/admin/admin.route.ts#L268-L277)
  - Modify: [`apps/backend/src/app/modules/admin/admin.system.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/admin/admin.system.service.ts#L231-L428)
- **Actions:**
  1. In [`stripe.controller.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/stripe/stripe.controller.ts#L62-L75), validate `customUrl` against an allowlist of schemes (`poolpay://`) and configured frontend origins; in [`mobileRedirect.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/mobileRedirect.ts#L23-L33), HTML-escape `message` and `JSON.stringify(targetUrl)` inside `<script>`.
  2. In [`multer.config.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/config/multer.config.ts#L42), add `limits: { fileSize: 10 * 1024 * 1024 }` (10MB) and a strict `fileFilter` allowing only safe image MIME types (`image/jpeg`, `image/png`, `image/webp`).
  3. In [`LocalStorageProvider.deleteFile`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/storage/localStorageProvider.ts#L67-L85), resolve `path.resolve(this.uploadBaseDir, relativePath)` and verify it starts with `path.resolve(this.uploadBaseDir) + path.sep` before calling `fs.unlink`.
  4. Add `ENCRYPTION_KEY` and `EXPRESS_SESSION_SECRET` to `CRITICAL_REQUIRED_KEYS` in [`env.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/config/env.ts#L131-L137).
  5. Remove the unauthenticated `/api/v1/admin` skip from `globalLimiter` in [`app.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app.ts#L134-L136), remove public `/postman_collection.json` and `/master_postman_collection.json` routes in [`app.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app.ts#L227-L238), and restrict `/api-docs` and `/api/v1/admin/debug/*` to non-production environments (also fixing `clearMockData` in [`admin.system.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/admin/admin.system.service.ts#L423-L428) to only delete `{ isMock: true }` notifications).

---

## Phase 2: Backend Financial Ledger, Workers, Notifications & DB Performance (`apps/backend`)

### Task 2.1: Fix Stripe Ledger Desyncs, Reconciliation Double-Charges & Admin Manual Resolution

- **Files:**
  - Modify: [`apps/backend/src/app/jobs/paymentRetry.job.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/jobs/paymentRetry.job.ts#L86-L207)
  - Modify: [`apps/backend/src/app/modules/webhook/webhook.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/webhook/webhook.service.ts#L89-L168)
  - Modify: [`apps/backend/src/app/jobs/reconciliation.worker.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/jobs/reconciliation.worker.ts#L50-L195)
  - Modify: [`apps/backend/src/app/modules/admin/admin.payment.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/admin/admin.payment.service.ts#L154-L254)
- **Actions:**
  1. Extract a single transactional helper `completeContributionPayment(paymentId, paymentIntent, session)` used by [`paymentRetry.job.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/jobs/paymentRetry.job.ts#L106-L169), [`webhook.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/webhook/webhook.service.ts#L89-L168), [`reconciliation.worker.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/jobs/reconciliation.worker.ts#L58-L68), and [`admin.payment.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/admin/admin.payment.service.ts#L154-L206):
     - Atomically transition `Payment` from `{ $ne: PaymentStatus.PAID }` to `PaymentStatus.PAID`.
     - Upsert `Transaction` (`referenceId: paymentIntent.id`, `status: TransactionStatus.SUCCESS`) so async ACH payments that didn't have a prior `Transaction` record still create one.
     - Increment `Group.poolAmount` by `payment.amount` and `GroupMember.totalPaidAmount` by `payment.amount`.
     - Upsert `Revenue` for platform fees.
  2. When [`paymentRetry.job.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/jobs/paymentRetry.job.ts#L201-L207) gets `paymentIntent.status === "processing"`, create a `PENDING` `Transaction` record with `referenceId: paymentIntent.id`.
  3. In [`reconciliation.worker.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/jobs/reconciliation.worker.ts#L58-L68), when `pi.status === "succeeded"`, call `completeContributionPayment` directly instead of resetting `payment.status = PENDING` and re-charging the user. For stuck `PROCESSING` turns (`lines 182-191`), keep `turn.status = TurnStatus.PROCESSING` when re-enqueuing `processPayout` so [`turnScheduler.worker.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/jobs/turnScheduler.worker.ts#L53) processes it and `scheduler.worker.ts` does not double-schedule it.
  4. In [`admin.payment.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/admin/admin.payment.service.ts#L208-L254) (`resolveTurn`), update `Payout`, `Transaction`, `Revenue`, `GroupMember.hasReceivedPayout`, `GroupMember.totalReceivedAmount`, `Group.poolAmount`, and group completion status inside a transaction.

### Task 2.2: Harden Stripe Production Key Check & Safe Runtime Environment Storage

- **Files:**
  - Modify: [`apps/backend/src/app/config/stripe.config.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/config/stripe.config.ts#L12-L43)
  - Modify: [`apps/backend/src/app/utils/envConfig.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/envConfig.ts#L12-L56)
  - Modify: [`apps/backend/src/app/config/dbConnect.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/config/dbConnect.ts#L8-L44) (and lines `117-159`)
  - Delete from Git tracking: [`apps/backend/src/app/config/runtime-env.json`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/config/runtime-env.json)
- **Actions:**
  1. In [`stripe.config.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/config/stripe.config.ts#L17-L26) and [`envConfig.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/envConfig.ts#L14-L18), throw an `AppError(httpStatus.INTERNAL_SERVER_ERROR, "Stripe Live Secret Key is not configured for production mode")` instead of falling back to `testStripeClient` when `appEnvironment === "production"`.
  2. Store `runtime-env.json` inside a writable data directory (`path.join(process.cwd(), "logs", "runtime-env.json")` or Redis) instead of `src/app/config/runtime-env.json` (which is tracked in Git and read-only in Docker `dist/`), and add `**/runtime-env.json` to `.gitignore`.

### Task 2.3: Fix Turn Recalculation, Atomic Group Joining & Transactional Account Deletion

- **Files:**
  - Modify: [`apps/backend/src/app/modules/turn/turn.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/turn/turn.service.ts#L112-L234)
  - Modify: [`apps/backend/src/app/modules/group/group.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/group/group.service.ts#L190-L370)
  - Modify: [`apps/backend/src/app/modules/groupMember/groupMember.model.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/groupMember/groupMember.model.ts#L39-L40)
  - Modify: [`apps/backend/src/app/modules/deletionRequest/deletionRequest.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/deletionRequest/deletionRequest.service.ts#L119-L166)
- **Actions:**
  1. In [`recalculateTurnsForGroup`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/turn/turn.service.ts#L125-L220), only delete turns with `status: { $in: [TurnStatus.PENDING, TurnStatus.UPCOMING] }`, preserve turns in `PAID`/`PROCESSING`/`MANUAL_REVIEW`/`RECOVERY_REQUIRED`, and when regenerating `Payment` records, skip creating a `PENDING` payment if a `PAID` payment already exists for that `{ groupId, userId, cycleNumber }` (and re-link its `turnId` to the new turn).
  2. In [`GroupServices.joinGroup`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/group/group.service.ts#L221-L295), use an atomic conditional update `Group.findOneAndUpdate({ _id: group._id, currentMembers: { $lt: group.totalMembers } }, { $inc: { currentMembers: 1 } }, { new: true, session })` and add a unique partial/compound index `{ groupId: 1, position: 1 }` on [`groupMember.model.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/groupMember/groupMember.model.ts#L39-L40).
  3. Wrap [`DeletionRequestServices.confirmDeletionRequest`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/deletionRequest/deletionRequest.service.ts#L119-L166) in `withTransaction`.

### Task 2.4: Fix Push Notifications Silently Failing Due to Missing `.select("+fcmToken")`

- **Files:**
  - Modify: [`apps/backend/src/app/jobs/notification.worker.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/jobs/notification.worker.ts#L35)
  - Modify: [`apps/backend/src/app/jobs/paymentRetry.job.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/jobs/paymentRetry.job.ts#L61)
  - Modify: [`apps/backend/src/app/jobs/turnScheduler.worker.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/jobs/turnScheduler.worker.ts#L67)
  - Modify: [`apps/backend/src/app/jobs/scheduler.worker.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/jobs/scheduler.worker.ts#L144) (and lines `355`, `447`, `559`)
  - Modify: [`apps/backend/src/app/modules/admin/admin.user.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/admin/admin.user.service.ts#L94) (and line `140`)
- **Actions:**
  1. Add `.select("+fcmToken")` to `User.findById` / `.populate("userId", "+fcmToken ...")` in all notification dispatchers and workers so `user.fcmToken` is populated and FCM push notifications are sent.

### Task 2.5: Fix N+1 Queries, Missing DB Indexes, Analytics Date/Export Bugs & Backend Code Hygiene

- **Files:**
  - Modify: [`apps/backend/src/app/modules/admin/admin.analytics.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/admin/admin.analytics.service.ts#L69-L116) (and lines `305-335`)
  - Modify: [`apps/backend/src/app/modules/revenue/revenue.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/revenue/revenue.service.ts#L28-L31)
  - Modify: [`apps/backend/src/app/modules/group/group.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/group/group.service.ts#L45-L121) (and lines `567-613`)
  - Modify: [`apps/backend/src/app/modules/admin/admin.user.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/admin/admin.user.service.ts#L153-L185)
  - Modify: [`apps/backend/src/app/modules/admin/admin.payment.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/admin/admin.payment.service.ts#L92-L131)
  - Modify: [`apps/backend/src/app/modules/revenue/revenue.model.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/revenue/revenue.model.ts#L19-L34)
  - Modify: [`apps/backend/src/app/modules/payment/payment.model.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/payment/payment.model.ts#L41-L85)
  - Modify: [`apps/backend/src/app/modules/turn/turn.model.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/turn/turn.model.ts#L45-L48)
  - Delete dead duplicate files: [`apps/backend/src/app/errorHelpers/handleValidationError.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/errorHelpers/handleValidationError.ts), [`apps/backend/src/app/errorHelpers/handleZodError.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/errorHelpers/handleZodError.ts)
- **Actions:**
  1. Replace per-group `Transaction.aggregate` in `getGroupFundDetails` and per-group `Turn`/`GroupMember` queries in `getAllGroups` with batched `$in: groupIds` queries; batch `User` and `PaymentMethod` lookups in `checkMembersPaymentMethods`.
  2. Add compound indexes `{ status: 1, updatedAt: 1 }` and `{ status: 1, dueDate: 1 }` on `Payment`, `{ status: 1, updatedAt: 1 }` and `{ status: 1, scheduledDate: 1 }` on `Turn`, and `{ createdAt: -1 }`, `{ feeType: 1, createdAt: -1 }` on `Revenue`; clean up duplicate single-field index declarations.
  3. Change year-end date filters from `new Date("${currentYear}-12-31")` to `new Date("${currentYear}-12-31T23:59:59.999Z")`.
  4. In `exportUsersToExcel` and `exportPaymentsToExcel`, default `query.limit` to `10000` so exports include all matching records instead of 10.
  5. Delegate `AdminSystemServices.updateSettings` to `SettingsServices.updateSettings`, delete unused `handleValidationError.ts` and `handleZodError.ts`, and replace `console.log`/`console.warn` with `logger`.

---

## Phase 3: Shared Workspace Packages & Monorepo Tooling (`packages/*`, Root Configs)

### Task 3.1: Upgrade `@repo/eslint-config`, Unify Prettier, and Fix All 166 Lint Problems

- **Files:**
  - Modify: [`packages/eslint-config/package.json`](file:///c:/Users/Adnan/ZProject/adnan/derival81/packages/eslint-config/package.json)
  - Modify: [`packages/eslint-config/base.js`](file:///c:/Users/Adnan/ZProject/adnan/derival81/packages/eslint-config/base.js)
  - Modify: [`packages/eslint-config/next.js`](file:///c:/Users/Adnan/ZProject/adnan/derival81/packages/eslint-config/next.js)
  - Delete conflicting config: [`apps/backend/.prettierrc`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/.prettierrc)
  - Modify: [`.prettierignore`](file:///c:/Users/Adnan/ZProject/adnan/derival81/.prettierignore)
  - Modify: [`apps/backend/src/app/modules/legal/legal.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/legal/legal.service.ts#L7), [`mobileMembership.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/modules/mobileMembership/mobileMembership.service.ts#L381-L382), [`imageOptimizer.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/imageOptimizer.ts#L64), [`localStorageProvider.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/storage/localStorageProvider.ts#L55), [`s3Provider.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/storage/s3Provider.ts#L66-L77), [`seedDemoGroups.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/seedDemoGroups.ts#L16)
- **Actions:**
  1. Convert `packages/eslint-config` to ESLint v9 Flat Config or align workspace ESLint configs.
  2. Fix all 8 ESLint errors in `apps/backend` and all 72 ESLint errors in `apps/admin` so `npm run lint` (`npx turbo lint`) exits with code `0`.
  3. Delete `apps/backend/.prettierrc` so the root [`prettier.config.js`](file:///c:/Users/Adnan/ZProject/adnan/derival81/prettier.config.js) governs the entire monorepo, and add `apps/mobile/` and `*postman_collection*.json` to [`.prettierignore`](file:///c:/Users/Adnan/ZProject/adnan/derival81/.prettierignore).

### Task 3.2: Align `@repo/types`, `@repo/validators`, and `@repo/ui` with Actual App Domain

- **Files:**
  - Modify: [`packages/types/src/index.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/packages/types/src/index.ts)
  - Modify: [`packages/validators/src/index.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/packages/validators/src/index.ts)
  - Modify: [`packages/ui/src/button.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/packages/ui/src/button.tsx)
  - Modify: [`apps/admin/next.config.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/next.config.ts)
- **Actions:**
  1. Update [`packages/types/src/index.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/packages/types/src/index.ts) to export the real `Role` enum (`super_admin`, `admin`, `user`), `UserStatus`, `KycStatus`, `IUser`, `IGroup`, `IPayment`, `ITurn`, `ITransaction`, and `ApiResponse<T>`.
  2. Update [`packages/validators/src/index.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/packages/validators/src/index.ts) to export `passwordSchema` (min 8 chars, letter + number), `loginSchema` (`identifier`, `password`), `resetPasswordSchema` (`identifier`, `code`, `newPassword`), and `registerSchema` (`firstName`, `lastName`, `email`, `phone`, `password`).
  3. Add `transpilePackages: ["@repo/ui", "@repo/types", "@repo/validators"]` to [`apps/admin/next.config.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/next.config.ts) and remove the unused `import dotenv from "dotenv"`.

### Task 3.3: Standardize Workspace Scripts & Pre-Commit Hooks

- **Files:**
  - Modify: [`package.json`](file:///c:/Users/Adnan/ZProject/adnan/derival81/package.json#L34-L71)
  - Modify: [`apps/klx-luxe-plus/package.json`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/klx-luxe-plus/package.json#L6-L14)
  - Modify: [`packages/types/package.json`](file:///c:/Users/Adnan/ZProject/adnan/derival81/packages/types/package.json), [`packages/validators/package.json`](file:///c:/Users/Adnan/ZProject/adnan/derival81/packages/validators/package.json), [`packages/ui/package.json`](file:///c:/Users/Adnan/ZProject/adnan/derival81/packages/ui/package.json)
- **Actions:**
  1. Alias `"test": "node --test tests/seo.test.mjs"` in `apps/klx-luxe-plus/package.json` so `turbo test` executes KLX tests, and add `lint:klx` to root `package.json`.
  2. Update `lint-staged` in root `package.json` to run `eslint --fix` before `prettier --write` on staged JS/TS files.

---

## Phase 4: Frontend Web Applications (`apps/admin`, `apps/klx-luxe-plus`)

### Task 4.1: Fix Admin Auth Bypass (`?demo=true`), Route Protection, Logout & 2FA Login Flow

- **Files:**
  - Modify: [`apps/admin/app/dashboard/layout.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/dashboard/layout.tsx#L15-L37)
  - Modify: [`apps/admin/app/login/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/login/page.tsx#L40-L95)
  - Modify: [`apps/admin/lib/api-auth.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/lib/api-auth.ts#L1-L40)
- **Actions:**
  1. Remove the `isDemo` (`?demo=true`) bypass in [`apps/admin/app/dashboard/layout.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/dashboard/layout.tsx#L17-L35) and verify that stored user role is `ADMIN` or `SUPER_ADMIN`.
  2. In [`apps/admin/app/login/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/login/page.tsx#L50-L75), handle `response.data?.requires2FA === true` by rendering a 6-digit OTP verification form that calls `POST /api/v1/auth/verify-2fa` (`verify2FA` in `api-auth.ts`), preventing admin lockouts when 2FA is enabled.
  3. Update [`logout()`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/lib/api-auth.ts#L28-L33) to call `await axiosInstance.post("/api/v1/auth/logout")` (with `try/finally`) before clearing client storage.

### Task 4.2: Fix Axios Token Refresh Bugs & Password Reset Contract Mismatch

- **Files:**
  - Modify: [`apps/admin/lib/axios.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/lib/axios.ts#L53-L125)
  - Modify: [`apps/admin/app/reset-password/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/reset-password/page.tsx#L30-L65)
- **Actions:**
  1. In [`apps/admin/lib/axios.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/lib/axios.ts#L53-L125):
     - Replace `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/auth/refresh-token` (line 95) with `${getBaseUrl()}/api/v1/auth/refresh-token`.
     - Remove `|| error.response?.status === 500` from line 63 so `500` errors never trigger token refresh or replay mutations.
     - Exclude auth endpoints (`/api/v1/auth/login`, `/api/v1/auth/verify-2fa`, `/api/v1/auth/forgot-password`, `/api/v1/auth/reset-password`) from the `401` interceptor redirect so login error toasts are not wiped by `window.location.href = "/login"`.
     - Ensure `processQueue(new Error("Refresh failed"), null)` and `Promise.reject(error)` are called if `response.data?.success` is false.
  2. In [`apps/admin/app/reset-password/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/reset-password/page.tsx#L48-L60), send `{ identifier: email, code, newPassword }` and validate that `newPassword` is at least 8 characters with a letter and a number.

### Task 4.3: Fix Admin Dashboard Data Bugs, Unreachable "Turns" Tab & Production Seed Buttons

- **Files:**
  - Modify: [`apps/admin/app/dashboard/settings/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/dashboard/settings/page.tsx#L634-L663)
  - Modify: [`apps/admin/app/dashboard/funds/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/dashboard/funds/page.tsx#L117-L130)
  - Modify: [`apps/admin/app/dashboard/payments/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/dashboard/payments/page.tsx#L60-L76)
  - Modify: [`apps/admin/app/dashboard/groups/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/dashboard/groups/page.tsx#L74-L76) (and lines `209-240`, `471-500`, `588-596`, `761-763`)
  - Modify: [`apps/admin/components/layout/TopNavbar.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/components/layout/TopNavbar.tsx#L33-L54) (and lines `136-141`)
  - Modify: [`apps/admin/app/dashboard/reports/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/dashboard/reports/page.tsx#L35-L87)
- **Actions:**
  1. Gate the `"Developer Tools"` card (`Seed Mock Data` / `Clear Mock Data`) in [`settings/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/dashboard/settings/page.tsx#L634-L663) behind `process.env.NODE_ENV === "development"`.
  2. Restore `"Turns"` to the tab list `{["Group Funds", "Turns"].map(...)}` in [`funds/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/dashboard/funds/page.tsx#L117).
  3. In [`groups/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/dashboard/groups/page.tsx#L74-L76), debounce `searchQuery` (300ms), reset `meta.page` to `1` on filter/search change, validate required fields before advancing Step 1/Step 2 of the Create Group modal, remove fake fallback strings (`"Latif Circle"`), and use optional chaining `group.createdBy?.firstName`.
  4. Wire the year selector dropdown in [`reports/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/dashboard/reports/page.tsx#L84-L87) and remove the dead `"Mobile App"` button in [`TopNavbar.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/components/layout/TopNavbar.tsx#L136-L141).

### Task 4.4: Shared Legal Markdown Renderer, Type Safety, Font Optimization & File Cleanup

- **Files:**
  - Create: `apps/admin/components/legal/LegalMarkdown.tsx`
  - Modify: [`apps/admin/app/dashboard/legal/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/dashboard/legal/page.tsx#L465-L505), [`apps/admin/app/legal/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/legal/page.tsx#L242-L276), [`apps/admin/app/privacy-policy/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/privacy-policy/page.tsx#L132-L166), [`apps/admin/app/terms-and-conditions/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/terms-and-conditions/page.tsx#L140-L174), [`apps/admin/app/cookie-policy/page.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/cookie-policy/page.tsx#L132-L166)
  - Modify: [`apps/admin/app/layout.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/layout.tsx#L13-L16)
  - Modify: [`apps/klx-luxe-plus/src/app/layout.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/klx-luxe-plus/src/app/layout.tsx#L31-L38)
  - Delete stray files: [`apps/admin/api.txt`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/api.txt), [`apps/admin/postman_collection (5).json`](<file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/postman_collection%20(5).json>)
- **Actions:**
  1. Create `<LegalMarkdown content={...} />` supporting headings (`##`, `###`), bullet lists (`-`, `*`), inline bold (`**text**`), and safe links (`[label](https://...)`), and replace the 5 copy-pasted parsers.
  2. Replace explicit `any` types in `apps/admin` with proper interfaces from `@repo/types`, update root metadata in [`apps/admin/app/layout.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/app/layout.tsx#L13-L16), use `next/font/google` in [`apps/klx-luxe-plus/src/app/layout.tsx`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/klx-luxe-plus/src/app/layout.tsx#L31-L38), and delete `apps/admin/api.txt` and `apps/admin/postman_collection (5).json`.

---

## Phase 5: Flutter Mobile Application (`apps/mobile`)

### Task 5.1: Secure Token Storage (`FlutterSecureStorage`), Complete Logout Wiping & Deep-Link CSRF Protection

- **Files:**
  - Modify: [`apps/mobile/lib/service/api/token_service.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/service/api/token_service.dart#L15-L67)
  - Modify: [`apps/mobile/lib/View/Screen/Auth/login/controller/login_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Auth/login/controller/login_controller.dart#L71-L76)
  - Modify: [`apps/mobile/lib/View/Screen/Auth/otp/controller/otp_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Auth/otp/controller/otp_controller.dart#L147-L153)
  - Modify: [`apps/mobile/lib/service/deep_link_service.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/service/deep_link_service.dart#L32-L105)
- **Actions:**
  1. In [`TokenService`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/service/api/token_service.dart#L15-L67), store `accessToken` and `refreshToken` in `FlutterSecureStorage` (removing plaintext `PrefsHelper.setString(PrefsHelper.refreshToken, ...)`), and ensure `clearTokens()` deletes **both** `_accessTokenKey` and `_refreshTokenKey` from secure storage and `SharedPreferences`.
  2. Update `LoginController`, `OtpController`, and `DeepLinkService` to call `await TokenService.to.saveTokens(accessToken: ..., refreshToken: ...)`.
  3. In [`DeepLinkService`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/service/deep_link_service.dart#L32-L105), only accept `poolpay://callback` / `poolpay://auth` tokens when an OAuth login flow was explicitly initiated by the user (checking an in-memory/pending OAuth flag and validating the token against `/users/me` before overwriting an active session).

### Task 5.2: Register GetX Route Table (`app_route.dart` & `main.dart`)

- **Files:**
  - Modify: [`apps/mobile/lib/Core/AppRoute/app_route.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/Core/AppRoute/app_route.dart)
  - Modify: [`apps/mobile/lib/main.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/main.dart#L64-L83)
  - Modify: [`apps/mobile/lib/service/api/auth_interceptor.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/service/api/auth_interceptor.dart#L138)
  - Modify: [`apps/mobile/lib/View/Screen/Groups/controller/group_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Groups/controller/group_controller.dart#L322)
- **Actions:**
  1. Populate [`app_route.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/Core/AppRoute/app_route.dart) with `AppRoute` constants (`/splash`, `/login`, `/home`, `/groups`, `/notifications`, `/profile`, etc.) and `getPages` definitions, and wire `getPages: AppRoute.routes` in [`main.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/main.dart#L64-L83) so `Get.offAllNamed('/login')` and `Get.offAllNamed('/home')` work reliably.

### Task 5.3: Fix Networking (`AuthInterceptor`, `Bearer` Header, Logging) & Stripe Google Pay Mode

- **Files:**
  - Modify: [`apps/mobile/lib/service/api/auth_interceptor.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/service/api/auth_interceptor.dart#L44-L139)
  - Modify: [`apps/mobile/lib/service/api/dio_client.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/service/api/dio_client.dart#L21-L24)
  - Modify: [`apps/mobile/lib/View/Screen/Auth/complete_profile/controller/complete_profile_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Auth/complete_profile/controller/complete_profile_controller.dart#L84)
  - Modify: [`apps/mobile/lib/View/Screen/Auth/payment_method/controller/payment_method_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Auth/payment_method/controller/payment_method_controller.dart#L247-L253)
  - Modify: [`apps/mobile/lib/config/app_credentials.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/config/app_credentials.dart#L46-L52)
- **Actions:**
  1. In [`AuthInterceptor._handleLogout`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/service/api/auth_interceptor.dart#L128-L139), iterate over `_requestQueue` and call `item['handler'].reject(...)` before `_requestQueue.clear()`, and add 15s timeouts to `refreshDio`.
  2. Guard `LogInterceptor` in [`dio_client.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/service/api/dio_client.dart#L21-L24) with `if (kDebugMode)` and remove sensitive token `print()` statements across controllers.
  3. Fix line 84 of [`complete_profile_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Auth/complete_profile/controller/complete_profile_controller.dart#L84) to `request.headers['Authorization'] = 'Bearer $token';`.
  4. In [`payment_method_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Auth/payment_method/controller/payment_method_controller.dart#L251), set `testEnv: !AppConfigService.isProductionMode`, and read Stripe publishable keys in [`app_credentials.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/config/app_credentials.dart#L46-L52) via `String.fromEnvironment(...)`.

### Task 5.4: Fix Socket.IO Lifecycle, IAP Stream Leak, Group/Payment Logic Bugs & Memory Leaks

- **Files:**
  - Modify: [`apps/mobile/lib/View/Screen/Groups/controller/group_chat_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Groups/controller/group_chat_controller.dart#L21-L116) (and lines `189-197`)
  - Modify: [`apps/mobile/lib/View/Screen/Subscription/controller/subscription_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Subscription/controller/subscription_controller.dart#L49-L60)
  - Modify: [`apps/mobile/lib/View/Screen/Groups/model/group_member_model.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Groups/model/group_member_model.dart#L22-L37)
  - Modify: [`apps/mobile/lib/View/Screen/Groups/model/group_model.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Groups/model/group_model.dart#L61)
  - Modify: [`apps/mobile/lib/View/Screen/Groups/view/active_group_details_screen.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Groups/view/active_group_details_screen.dart#L587-L610)
  - Modify: [`apps/mobile/lib/View/Screen/Groups/view/group_details_screen.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Groups/view/group_details_screen.dart#L498-L521) (and line `801`)
  - Modify: [`apps/mobile/lib/View/Screen/PaymentHistory/controller/payment_history_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/PaymentHistory/controller/payment_history_controller.dart#L67-L86)
  - Modify: [`apps/mobile/lib/View/Screen/Payment/controller/payment_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Payment/controller/payment_controller.dart#L79-L80)
  - Modify: [`apps/mobile/lib/View/Screen/Notification/controller/notification_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Notification/controller/notification_controller.dart#L121-L133)
  - Modify: [`apps/mobile/lib/View/Screen/Language/view/language_screen.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Language/view/language_screen.dart#L99-L105)
- **Actions:**
  1. Make `IO.Socket? socket;` nullable in [`group_chat_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Groups/controller/group_chat_controller.dart#L21), remove listeners (`socket?.off(...)`) on close, and scroll to `0.0` (bottom of `reverse: true` list) instead of `maxScrollExtent`.
  2. Cancel `await _subscription?.cancel()` before listening in [`SubscriptionController._initIap`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Subscription/controller/subscription_controller.dart#L50).
  3. Store both `membershipId` (`json['_id']`) and `userId` (`user['_id']`) in [`GroupMemberModel`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Groups/model/group_member_model.dart#L26), wire `value == 'notice'` to `sendPenaltyNotice` in [`active_group_details_screen.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Groups/view/active_group_details_screen.dart#L587-L610) and [`group_details_screen.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Groups/view/group_details_screen.dart#L498-L521), and replace hardcoded `'YRSS496ZBG'` at [`group_details_screen.dart:801`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Groups/view/group_details_screen.dart#L801) with `group.inviteCode ?? 'No Code Available'`.
  4. Guard division by zero in [`GroupModel.fromJson`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Groups/model/group_model.dart#L61) (`final total = (json['totalMembers'] ?? 0) as num; progress: total > 0 ? ((json['currentMembers'] ?? 0) / total).clamp(0.0, 1.0) : 0.0`).
  5. Convert filter status to snake_case (`selectedFilter.value.toLowerCase().replaceAll(' ', '_')`) in [`payment_history_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/PaymentHistory/controller/payment_history_controller.dart#L79-L86) and fix `totalContributed` / `thisMonthSpent` stat mapping.
  6. Call the backend mark-as-read endpoint in [`NotificationController.markAsRead`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/View/Screen/Notification/controller/notification_controller.dart#L121-L133), wrap `LanguageScreen` list item in `Obx`, check `if (isClosed) return false;` in `OtpController` timers, and dispose all `TextEditingController`s in `CreateGroupController`.

### Task 5.5: Fix Android/iOS Native Configs, Clean Up 21 Stray/Empty Files in `lib/`, and Fix Widget Tests

- **Files:**
  - Modify: [`apps/mobile/android/app/build.gradle.kts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/android/app/build.gradle.kts#L51-L60)
  - Modify: [`apps/mobile/android/.gitignore`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/android/.gitignore#L1-L5)
  - Modify: [`apps/mobile/lib/main.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/main.dart#L24-L32)
  - Modify: [`apps/mobile/test/widget_test.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/test/widget_test.dart)
  - Delete 12 unused 0-byte Dart files and 8 stray `.txt`/`.md`/`.json` files in `apps/mobile/lib/`
- **Actions:**
  1. In [`build.gradle.kts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/android/app/build.gradle.kts#L58), set `debugSymbolLevel = "SYMBOL_TABLE"`, and in [`apps/mobile/android/.gitignore`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/android/.gitignore#L1-L5), remove rules ignoring `gradle-wrapper.jar`, `/gradlew`, and `/gradlew.bat`.
  2. Wrap `Firebase.initializeApp()` and `NotificationService().init()` in [`main.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/lib/main.dart#L24-L32) in a safe platform/error guard so iOS does not crash if `GoogleService-Info.plist` is not bundled.
  3. Delete all 8 stray `.txt`/`.md`/`.json` files (`PoolPay_Master_Collection.postman_collection.json`, `Stripe.txt`, `Push-notification.txt`, `in_app_purchase_api (1).md`, `language.txt`, `new-cng.txt`, `newData.txt`, `paymathod-add.txt`) and the unused 0-byte placeholder files from `apps/mobile/lib/`.
  4. Replace `[Jurisdiction]` / `[your State/Country]` legal placeholders in `sign_up_screen.dart` and `profile_screen.dart`, sync version numbers (`1.0.6`), and update [`widget_test.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/mobile/test/widget_test.dart) to register required controllers and pass `flutter test`.

---

## Phase 6: DevOps, Docker, Nginx, Backups & CI/CD Infrastructure

### Task 6.1: Create `.dockerignore`, Isolate Frontend Container Env & Clean Up Secrets Hygiene

- **Files:**
  - Create: `.dockerignore`
  - Modify: [`.gitignore`](file:///c:/Users/Adnan/ZProject/adnan/derival81/.gitignore)
  - Modify: [`apps/admin/.gitignore`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/.gitignore)
  - Modify: [`docker-compose.prod.yml`](file:///c:/Users/Adnan/ZProject/adnan/derival81/docker-compose.prod.yml#L68-L85)
  - Modify: [`.env.example`](file:///c:/Users/Adnan/ZProject/adnan/derival81/.env.example), [`apps/admin/.env.example`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/.env.example), [`apps/backend/.env.example`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/.env.example)
- **Actions:**
  1. Create a root `.dockerignore` excluding `.git`, `**/node_modules`, `**/.next`, `**/dist`, `**/build`, `.env*`, `*.p8`, `*service-account*.json`, `apps/mobile`, `uploads`, and `logs`.
  2. Update [`.gitignore`](file:///c:/Users/Adnan/ZProject/adnan/derival81/.gitignore) to ignore `.env.*` (with `!.env.example`), `*.p8`, `*service-account*.json`, and `**/runtime-env.json`; add `!.env.example` to `apps/admin/.gitignore`.
  3. Populate `apps/admin/.env.example`, sanitize real IPs/passwords from root `.env.example`, and sync `apps/backend/.env.example`.
  4. In [`docker-compose.prod.yml`](file:///c:/Users/Adnan/ZProject/adnan/derival81/docker-compose.prod.yml#L73-L74), remove `env_file: - .env` from the `admin` service and pass only `NODE_ENV`, `PORT`, `NEXT_PUBLIC_BASE_URL`, and `NEXT_PUBLIC_SOCKET_URL`.

### Task 6.2: Fix Nginx HTTPS Persistence Across Redeployments, Docker Socket `666` & Real `/health` Checks

- **Files:**
  - Create: `nginx/poolpay-ssl.conf`
  - Modify: [`nginx/poolpay.conf`](file:///c:/Users/Adnan/ZProject/adnan/derival81/nginx/poolpay.conf)
  - Modify: [`nginx/klxluxeplus-ssl.conf`](file:///c:/Users/Adnan/ZProject/adnan/derival81/nginx/klxluxeplus-ssl.conf#L25-L38)
  - Modify: [`deploy/deploy.sh`](file:///c:/Users/Adnan/ZProject/adnan/derival81/deploy/deploy.sh#L58-L153)
  - Modify: [`deploy/deploy-klx.sh`](file:///c:/Users/Adnan/ZProject/adnan/derival81/deploy/deploy-klx.sh#L50-L57)
  - Modify: [`apps/backend/src/app.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app.ts#L147-L154)
- **Actions:**
  1. Create `nginx/poolpay-ssl.conf` with full port 80 → 443 redirects, Let's Encrypt certificate paths (`/etc/letsencrypt/live/poolpay.space/fullchain.pem`), HSTS, `X-Frame-Options`, `X-Content-Type-Options`, and WebSocket headers.
  2. Update [`deploy/deploy.sh`](file:///c:/Users/Adnan/ZProject/adnan/derival81/deploy/deploy.sh#L70-L78) (just like `deploy-klx.sh:29-33`) to check `if [ -f "/etc/letsencrypt/live/poolpay.space/fullchain.pem" ]; then sudo cp nginx/poolpay-ssl.conf /etc/nginx/sites-available/poolpay.conf; else sudo cp nginx/poolpay.conf ...; fi`—guaranteeing HTTPS is never wiped on redeploy.
  3. Remove `sudo chmod 666 /var/run/docker.sock` from [`deploy/deploy.sh`](file:///c:/Users/Adnan/ZProject/adnan/derival81/deploy/deploy.sh#L60).
  4. Update `GET /health` in [`apps/backend/src/app.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app.ts#L147-L154) to verify `mongoose.connection.readyState === 1` and Redis connectivity, returning HTTP `503` if degraded.
  5. Update [`deploy/deploy.sh`](file:///c:/Users/Adnan/ZProject/adnan/derival81/deploy/deploy.sh#L98-L133) to health-check both `:5000/health` (backend) and `:5001` (admin), and update `.current_tag` when rolling back.

### Task 6.3: Fix MongoDB Backup Scripts (`backup-mongodb.sh` & `backupDatabase.ts`)

- **Files:**
  - Modify: [`scripts/backup-mongodb.sh`](file:///c:/Users/Adnan/ZProject/adnan/derival81/scripts/backup-mongodb.sh#L1-L25)
  - Modify: [`apps/backend/src/app/utils/backupDatabase.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/backupDatabase.ts#L28-L69)
  - Modify: [`.github/workflows/deploy.yml`](file:///c:/Users/Adnan/ZProject/adnan/derival81/.github/workflows/deploy.yml#L301-L317)
- **Actions:**
  1. Update [`scripts/backup-mongodb.sh`](file:///c:/Users/Adnan/ZProject/adnan/derival81/scripts/backup-mongodb.sh#L1-L25) and [`.github/workflows/deploy.yml`](file:///c:/Users/Adnan/ZProject/adnan/derival81/.github/workflows/deploy.yml#L301-L317) to authenticate using the container's `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` (`--authenticationDatabase admin`), dump both `poolPay-db-live` and `poolPay-db-test`, and fail loudly on error instead of masking failures with `|| true`.
  2. In [`backupDatabase.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/src/app/utils/backupDatabase.ts#L28-L69), replace `exec(...)` string interpolation with `execFile("mongodump", [`--uri=${finalDbUrl}`, `--archive=${backupFilePath}`, "--gzip"])` to eliminate command injection, and install `mongodb-tools` in `apps/backend/Dockerfile` (`apk add --no-cache mongodb-tools`).

### Task 6.4: Harden Dockerfiles & Docker Compose Configurations

- **Files:**
  - Modify: [`apps/backend/Dockerfile`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/Dockerfile#L25-L61)
  - Modify: [`apps/admin/Dockerfile`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/Dockerfile#L35-L58)
  - Modify: [`docker-compose.prod.yml`](file:///c:/Users/Adnan/ZProject/adnan/derival81/docker-compose.prod.yml)
  - Modify: [`docker-compose.yml`](file:///c:/Users/Adnan/ZProject/adnan/derival81/docker-compose.yml)
  - Modify: [`scripts/mongo-init.js`](file:///c:/Users/Adnan/ZProject/adnan/derival81/scripts/mongo-init.js)
- **Actions:**
  1. In [`apps/backend/Dockerfile`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/Dockerfile#L25-L61), run `npm prune --omit=dev` before copying `node_modules` to the runner stage, and set `--chown=expressjs:nodejs` on `/app/apps/backend/dist`.
  2. In [`apps/admin/Dockerfile`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/admin/Dockerfile#L39-L48), add `ENV HOSTNAME="0.0.0.0"` and `--chown=nextjs:nodejs` on copied assets.
  3. In [`docker-compose.prod.yml`](file:///c:/Users/Adnan/ZProject/adnan/derival81/docker-compose.prod.yml), add log rotation (`max-size: "10m"`, `max-file: "3"`) and memory limits to all services.
  4. In [`docker-compose.yml`](file:///c:/Users/Adnan/ZProject/adnan/derival81/docker-compose.yml), bind ports to `127.0.0.1`, enable `ME_CONFIG_BASICAUTH=true` on `mongo-express`, and add a `redis:7.2-alpine` service for local development.

### Task 6.5: Harden CI/CD Workflow (`deploy.yml`) & Sync Documentation

- **Files:**
  - Modify: [`.github/workflows/deploy.yml`](file:///c:/Users/Adnan/ZProject/adnan/derival81/.github/workflows/deploy.yml)
  - Delete legacy workflow: [`apps/backend/.github/workflows/ci-cd.yml`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/.github/workflows/ci-cd.yml), [`apps/backend/.github/workflows/atomic-deployment-example.txt`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/backend/.github/workflows/atomic-deployment-example.txt)
  - Modify: [`README.md`](file:///c:/Users/Adnan/ZProject/adnan/derival81/README.md), [`CICD.md`](file:///c:/Users/Adnan/ZProject/adnan/derival81/CICD.md), [`STRIPE_LIVE_SETUP_GUIDE.md`](file:///c:/Users/Adnan/ZProject/adnan/derival81/STRIPE_LIVE_SETUP_GUIDE.md)
- **Actions:**
  1. In [`.github/workflows/deploy.yml`](file:///c:/Users/Adnan/ZProject/adnan/derival81/.github/workflows/deploy.yml):
     - Add `::add-mask::` for each transformed line of `EC2_SSH_KEY` (matching `deploy-klx.yml`).
     - Set `RATE_LIMITER_ENABLED=true` in generated `.env.production` and quote `.env` values containing special characters.
     - Run `npx turbo lint` and `npx turbo test` in Stage 1 alongside `npx turbo typecheck`.
     - Remove `git remote set-url origin "https://x-access-token:${GHCR_TOKEN}@..."` and `git reset --hard origin/main` in Stage 3 so SCP-transferred files are not overwritten and tokens are not persisted in `.git/config`.
     - Make Stage 4 (`ssl-and-verify`) fail with `exit 1` if backend or admin HTTPS health checks fail.
  2. Delete the stale `apps/backend/.github/` directory and update `README.md`, `CICD.md`, and `STRIPE_LIVE_SETUP_GUIDE.md` to reflect accurate paths, domains, and setup steps.

---

## Verification Plan

1. **Static Analysis & Type Checking**:
   - Run `npm run typecheck` (`npx turbo typecheck`) — verify all 6 TypeScript workspaces pass with 0 errors.
   - Run `npm run lint` (`npx turbo lint`) — verify `@repo/admin`, `@repo/backend`, `@repo/klx-luxe-plus`, and `@repo/mobile` pass with 0 errors.
2. **Automated Test Suites**:
   - Run `npm test` (`npx turbo test`) — verify backend unit/integration tests and `apps/klx-luxe-plus` SEO tests pass.
   - Run `flutter analyze` and `flutter test` inside `apps/mobile` — verify 0 Dart errors and passing widget tests.
3. **Production Build Verification**:
   - Run `npm run build:backend`, `npm run build:admin`, and `npm run build:klx` — verify clean compilation of `dist/`, `.next/standalone`, and `out/`.
