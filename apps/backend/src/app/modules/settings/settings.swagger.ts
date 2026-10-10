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
 *               platformCommissionPercent:
 *                 type: number
 *               sessionTimeoutMinutes:
 *                 type: number
 *                 description: Mobile app session inactivity timeout in minutes (default 20)
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

/**
 * @swagger
 * /settings/auth-status:
 *   get:
 *     summary: Get authentication and session policies (accessible to logged-in users / mobile app)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auth settings and sessionTimeoutMinutes retrieved successfully
 */
