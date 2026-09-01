/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Global System Settings API (Admin only)
 */

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get all system settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 */

/**
 * @swagger
 * /settings/update:
 *   patch:
 *     summary: Update global system settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platformName:
 *                 type: string
 *               transactionFeePercent:
 *                 type: number
 *               lateFeePercent:
 *                 type: number
 *               gracePeriodDays:
 *                 type: number
 *               maxRetryCount:
 *                 type: number
 *               supportEmail:
 *                 type: string
 *               isUserRegistrationEnabled:
 *                 type: boolean
 *               isSocialLoginEnabled:
 *                 type: boolean
 *               isTwoFactorAuthenticationEnabled:
 *                 type: boolean
 *               isEmailNotificationEnabled:
 *                 type: boolean
 *               isSMSNotificationEnabled:
 *                 type: boolean
 *               isPushNotificationEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
