/**
 * @swagger
 * tags:
 *   name: GroupMembers
 *   description: Group Membership API
 */

/**
 * @swagger
 * /group-members/my-groups:
 *   get:
 *     summary: Get groups joined by the current user
 *     tags: [GroupMembers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
 */

/**
 * @swagger
 * /group-members/join:
 *   post:
 *     summary: Join a savings group using invite code
 *     tags: [GroupMembers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inviteCode
 *             properties:
 *               inviteCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully joined the group
 */

/**
 * @swagger
 * /group-members/{groupId}:
 *   get:
 *     summary: Get all members of a specific group
 *     tags: [GroupMembers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Members retrieved successfully
 */

/**
 * @swagger
 * /group-members/{id}/remove:
 *   patch:
 *     summary: Remove a member from a group (Admin only)
 *     tags: [GroupMembers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Membership ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 */
/**
 * @swagger
 * /group-members/{id}/notice:
 *   patch:
 *     summary: Update member notice status (Admin only)
 *     tags: [GroupMembers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Membership ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - noticeStatus
 *             properties:
 *               noticeStatus:
 *                 type: string
 *                 enum: [NONE, NOTICE, FINAL_NOTICE]
 *     responses:
 *       200:
 *         description: Notice status updated successfully
 */
