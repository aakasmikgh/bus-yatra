const express = require('express');
const {
    initializeEsewa,
    verifyEsewa,
    renderEsewaForm,
    initializeKhalti,
    verifyKhalti,
    initializeStripe,
    stripeSuccess,
    stripeCancel
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/initialize-esewa', protect, initializeEsewa);
router.get('/render-form', renderEsewaForm);
router.get('/verify-esewa', verifyEsewa);

// Khalti Routes
router.post('/initialize-khalti', protect, initializeKhalti);
router.get('/verify-khalti', verifyKhalti);

// Stripe Routes
router.post('/initialize-stripe', protect, initializeStripe);
router.get('/stripe-success', stripeSuccess);
router.get('/stripe-cancel', stripeCancel);

module.exports = router;
