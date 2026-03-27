const express = require('express');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/clear', clearNotifications);

module.exports = router;
