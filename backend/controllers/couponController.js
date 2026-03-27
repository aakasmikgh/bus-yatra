const Coupon = require('../models/Coupon');

// @desc    Get all active coupons
// @route   GET /api/coupons
// @access  Public
exports.getCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.find({ isActive: true, expiryDate: { $gte: new Date() } });
        res.status(200).json({ success: true, count: coupons.length, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons/admin
// @access  Private/Admin
exports.getAdminCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.find().sort('-createdAt');
        res.status(200).json({ success: true, count: coupons.length, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new coupon
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({ success: true, data: coupon });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Validate coupon for a user
// @route   POST /api/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res, next) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true,
            expiryDate: { $gte: new Date() }
        });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });
        }

        if (coupon.usedBy.some(id => id.toString() === userId)) {
            return res.status(400).json({ success: false, message: 'Promo code already redeemed' });
        }

        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle coupon status
// @route   PUT /api/coupons/:id/toggle
// @access  Private/Admin
exports.toggleCouponStatus = async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        coupon.isActive = !coupon.isActive;
        await coupon.save();
        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
