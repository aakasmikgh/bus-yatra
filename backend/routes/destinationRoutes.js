const express = require('express');
const {
    getDestinations,
    getAdminDestinations,
    createDestination,
    createDestinationsBulk,
    updateDestination,
    deleteDestination
} = require('../controllers/destinationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route – needed for mobile search
router.get('/', getDestinations);

// Protected Admin routes
router.get('/admin', protect, authorize('admin'), getAdminDestinations);
router.post('/', protect, authorize('admin'), createDestination);
router.post('/bulk', protect, authorize('admin'), createDestinationsBulk);
router.put('/:id', protect, authorize('admin'), updateDestination);
router.delete('/:id', protect, authorize('admin'), deleteDestination);

module.exports = router;
