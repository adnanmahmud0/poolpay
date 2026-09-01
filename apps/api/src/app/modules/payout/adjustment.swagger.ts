/**
 * @swagger
 * tags:
 *   name: Adjustments
 *   description: Financial adjustments and payout corrections
 */

/**
 * @swagger
 * /payouts/adjustments:
 *   get:
 *     summary: Get all adjustments (Admin only)
 *     tags: [Adjustments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Adjustments retrieved successfully
 *   post:
 *     summary: Create a manual adjustment (Admin only)
 *     description: Create a financial adjustment for a user (e.g., manual correction).
 *     tags: [Adjustments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *               - type
 *               - reason
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [CREDIT, DEBIT]
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Adjustment created successfully
 */
