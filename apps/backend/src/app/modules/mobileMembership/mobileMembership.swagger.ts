/**
 * @swagger
 * tags:
 *   name: MobileMembership
 *   description: Native Mobile In-App Purchase Subscriptions (Google Play & Apple App Store)
 */

/**
 * @swagger
 * /mobile-membership/verify-google:
 *   post:
 *     summary: Verify and activate Google Play Store In-App Subscription
 *     tags: [MobileMembership]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - token
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "regular_membership"
 *                 description: "Google Play Store SKU / Product ID (e.g. regular_membership or vip_membership)"
 *               token:
 *                 type: string
 *                 description: "Purchase token returned by Google Play Billing on Android"
 *     responses:
 *       200:
 *         description: Google Play subscription verified and membership tier activated successfully.
 */

/**
 * @swagger
 * /mobile-membership/verify-apple:
 *   post:
 *     summary: Verify and activate Apple App Store (StoreKit) In-App Subscription
 *     tags: [MobileMembership]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiptData
 *             properties:
 *               receiptData:
 *                 type: string
 *                 description: "Base64 encoded App Store receipt string"
 *     responses:
 *       200:
 *         description: Apple App Store receipt verified and membership tier activated successfully.
 */

/**
 * @swagger
 * /mobile-membership/sync:
 *   post:
 *     summary: Synchronize active Google Play or Apple App Store subscription status
 *     tags: [MobileMembership]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status synchronized with store
 */

/**
 * @swagger
 * /mobile-membership/status:
 *   get:
 *     summary: Get current mobile membership and subscription details
 *     tags: [MobileMembership]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mobile membership status retrieved
 */
