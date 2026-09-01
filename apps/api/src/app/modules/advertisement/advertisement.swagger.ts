/**
 * @swagger
 * tags:
 *   name: Advertisements
 *   description: System-wide advertisement management
 */

/**
 * @swagger
 * /advertisements/active:
 *   get:
 *     summary: Get currently active advertisements
 *     description: Returns a list of ads that are currently active and within their scheduled date range, sorted by priority.
 *     tags: [Advertisements]
 *     responses:
 *       200:
 *         description: Active ads retrieved successfully
 */

/**
 * @swagger
 * /advertisements:
 *   get:
 *     summary: Get all advertisements (Admin only)
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All ads retrieved successfully
 *   post:
 *     summary: Create a new advertisement (Admin only)
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - imageUrl
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               redirectUrl:
 *                 type: string
 *               priority:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Advertisement created successfully
 */

/**
 * @swagger
 * /advertisements/{id}:
 *   get:
 *     summary: Get a single advertisement by ID
 *     tags: [Advertisements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Advertisement retrieved successfully
 *   patch:
 *     summary: Update an advertisement (Admin only)
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Advertisement updated successfully
 *   delete:
 *     summary: Delete an advertisement (Admin only)
 *     tags: [Advertisements]
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
 *         description: Advertisement deleted successfully
 */
