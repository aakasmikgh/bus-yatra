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
const { getOptimizedRoute } = require('../controllers/algorithmController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();


// Admin routes
router.get('/admin', protect, authorize('admin'), getAdminRoutes);
router.post('/', protect, authorize('admin'), createRoute);
router.put('/:id', protect, authorize('admin'), updateRoute);
router.delete('/:id', protect, authorize('admin'), deleteRoute);

// Public route for mobile
router.get('/', getRoutes);
router.get('/search', searchRoutes);
router.get('/optimize', getOptimizedRoute);
router.get('/:id', getRoute);


module.exports = router;
