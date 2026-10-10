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
 *                     membershipProvider:
 *                       type: string
 *                       enum: [google_play, apple_store]
 *                     autoRenewEnabled:
 *                       type: boolean
 */
