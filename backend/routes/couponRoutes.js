const express = require('express');
const {
    getCoupons,
    getAdminCoupons,
    createCoupon,
    validateCoupon,
    toggleCouponStatus
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getCoupons);
router.get('/admin', protect, authorize('admin'), getAdminCoupons);
router.post('/', protect, authorize('admin'), createCoupon);
router.post('/validate', protect, validateCoupon);
router.put('/:id/toggle', protect, authorize('admin'), toggleCouponStatus);

module.exports = router;
