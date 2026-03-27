const Notification = require('../models/Notification');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private/Admin
exports.getNotifications = async (req, res, next) => {
    try {
        console.log('--- NOTIFICATION DEBUG ---');
        console.log('User ID from token:', req.user.id);
        console.log('User Role:', req.user.role);

        const notifications = await Notification.find()
            .sort('-createdAt')
            .limit(20);

        console.log(`Found ${notifications.length} notifications`);
        console.log('---------------------------');

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private/Admin
exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, {
            new: true,
            runValidators: true
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private/Admin
exports.markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear
// @access  Private/Admin
exports.clearNotifications = async (req, res, next) => {
    try {
        await Notification.deleteMany({});
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};
