const express = require('express');
const {
    getRoutes,
    getAdminRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
    searchRoutes,
    getRoute
} = require('../controllers/routeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route for mobile
/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Get all routes
 *     tags: [Routes]
 *     responses:
 *       200:
 *         description: List of routes
 */
router.get('/', getRoutes);
router.get('/search', searchRoutes);
router.get('/:id', getRoute);

// Admin routes
router.get('/admin', protect, authorize('admin'), getAdminRoutes);
router.post('/', protect, authorize('admin'), createRoute);
router.put('/:id', protect, authorize('admin'), updateRoute);
router.delete('/:id', protect, authorize('admin'), deleteRoute);

module.exports = router;
