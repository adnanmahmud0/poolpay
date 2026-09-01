/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative Dashboard API
 */

/**
 * @swagger
 * /admin/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 */

/**
 * @swagger
 * /admin/dashboard/revenue-chart:
 *   get:
 *     summary: Get revenue chart data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue data retrieved successfully
 */

/**
 * @swagger
 * /admin/dashboard/user-growth:
 *   get:
 *     summary: Get user growth analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User growth data retrieved successfully
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users with filtering and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, active, blocked, suspended]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */

/**
 * @swagger
 * /admin/dashboard/recent-activities:
 *   get:
 *     summary: Get recent system activities for dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activities retrieved successfully
 */

/**
 * @swagger
 * /admin/pending-actions:
 *   get:
 *     summary: Get count of pending actions requiring attention
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending actions retrieved successfully
 */

/**
 * @swagger
 * /admin/funds/summary:
 *   get:
 *     summary: Get global funds summary
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Funds summary retrieved successfully
 */

/**
 * @swagger
 * /admin/payouts:
 *   get:
 *     summary: Get all payouts with pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payouts retrieved successfully
 */

/**
 * @swagger
 * /admin/payouts/{id}/retry:
 *   post:
 *     summary: Manually retry a failed payout
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payout retry initiated
 */

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: Get system audit logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 */

/**
 * @swagger
 * /admin/reports/financial:
 *   get:
 *     summary: Get comprehensive financial report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial report retrieved successfully
 */

/**
 * @swagger
 * /admin/reports/performance:
 *   get:
 *     summary: Get system performance analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance data retrieved successfully
 */

/**
 * @swagger
 * /admin/debug/seed-mock-data:
 *   post:
 *     summary: Seed mockup data for testing (Super Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mock data seeded successfully
 */

/**
 * @swagger
 * /admin/debug/clear-mock-data:
 *   delete:
 *     summary: Clear mockup data (Super Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mock data cleared successfully
 */

/**
 * @swagger
 * /admin/debug/test-push-notification:
 *   post:
 *     summary: Send a test push notification to all users (Super Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test notification sent
 */
