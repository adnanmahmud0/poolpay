/**
 * @swagger
 * tags:
 *   name: PaymentMethods
 *   description: User Payment Methods API
 */

/**
 * @swagger
 * /payment-methods/create-setup-intent:
 *   post:
 *     summary: Create a Stripe SetupIntent to add a payment method
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SetupIntent created successfully
 */

/**
 * @swagger
 * /payment-methods:
 *   get:
 *     summary: List all payment methods for the current user
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 */

/**
 * @swagger
 * /payment-methods:
 *   post:
 *     summary: Link a Stripe payment method to the user account
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment method added successfully
 */

/**
 * @swagger
 * /payment-methods/{id}:
 *   delete:
 *     summary: Delete a payment method
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment Method ID
 *     responses:
 *       200:
 *         description: Payment method deleted successfully
 */
