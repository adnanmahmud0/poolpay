/**
 * @swagger
 * tags:
 *   name: Stripe
 *   description: Stripe Connect and Onboarding API
 */

/**
 * @swagger
 * /stripe/connect/account-link:
 *   post:
 *     summary: Create a Stripe Connect onboarding link
 *     description: Generates a URL for the user to complete Stripe Connect Express onboarding.
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               returnUrl:
 *                 type: string
 *                 example: "poolpay://stripe-connect/return"
 *               refreshUrl:
 *                 type: string
 *                 example: "poolpay://stripe-connect/refresh"
 *     responses:
 *       200:
 *         description: Onboarding link created
 */

/**
 * @swagger
 * /stripe/connect/status:
 *   get:
 *     summary: Check Stripe Connect onboarding status
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 */

/**
 * @swagger
 * /stripe/connect/login-link:
 *   get:
 *     summary: Create a login link for Stripe Express Dashboard
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Login link created
 */

/**
 * @swagger
 * /stripe/connect/unlink:
 *   delete:
 *     summary: Disconnect Stripe account from the platform
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account unlinked successfully
 */
