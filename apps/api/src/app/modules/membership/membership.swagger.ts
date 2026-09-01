/**
 * @swagger
 * tags:
 *   name: Membership
 *   description: Membership and Subscription Management API
 */

/**
 * @swagger
 * /membership/status:
 *   get:
 *     summary: Get current logged-in user's membership status
 *     tags: [Membership]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Membership status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     membershipTier:
 *                       type: string
 *                       enum: [guest, regular, vip]
 *                     subscriptionStatus:
 *                       type: string
 *                     subscriptionExpiry:
 *                       type: string
 *                       format: date-time
 *                     autoRenewEnabled:
 *                       type: boolean
 *                     stripeSubscriptionId:
 *                       type: string
 */

/**
 * @swagger
 * /membership/subscribe:
 *   post:
 *     summary: Create or update a membership subscription (Unified Endpoint)
 *     description: This endpoint handles both initial subscription for GUEST users and upgrades/downgrades for existing members. Returns a Stripe PaymentIntent clientSecret for native Payment Sheet integration.
 *     tags: [Membership]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetTier
 *             properties:
 *               targetTier:
 *                 type: string
 *                 enum: [regular, vip]
 *               successUrl:
 *                 type: string
 *               cancelUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription session/update created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscriptionId:
 *                       type: string
 *                     clientSecret:
 *                       type: string
 *                     status:
 *                       type: string
 *                     isUpdate:
 *                       type: boolean
 */

/**
 * @swagger
 * /membership/cancel:
 *   post:
 *     summary: Cancel current membership subscription immediately
 *     description: Cancels the subscription on Stripe and immediately reverts the user to GUEST status.
 *     tags: [Membership]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 */

/**
 * @swagger
 * /membership/toggle-auto-renew:
 *   post:
 *     summary: Toggle subscription auto-renewal
 *     tags: [Membership]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - autoRenew
 *             properties:
 *               autoRenew:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Auto-renew setting updated successfully
 */
