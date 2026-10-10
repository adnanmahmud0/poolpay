/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Savings Groups Management API
 */

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a new savings group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - contributionAmount
 *               - totalMembers
 *               - frequency
 *               - startDate
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               contributionAmount:
 *                 type: number
 *               totalMembers:
 *                 type: number
 *               contributionFrequency:
 *                 type: string
 *                 enum: [weekly, monthly, yearly]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Group created successfully
 */

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     summary: Get details of a specific savings group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group details retrieved successfully
 */

/**
 * @swagger
 * /groups/invite/{inviteCode}:
 *   get:
 *     summary: Get group details by invite code
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inviteCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Invite Code
 *     responses:
 *       200:
 *         description: Group details retrieved successfully
 */

/**
 * @swagger
 * /groups/{id}/start:
 *   post:
 *     summary: Officially start the savings cycle for a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group started successfully
 */

/**
 * @swagger
 * /groups/{id}:
 *   delete:
 *     summary: Delete a savings group (Creator or Admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group deleted successfully
 */
