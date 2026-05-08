const express = require('express');
const {
    initializeStripe,
    stripeSuccess,
    stripeCancel
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/payment/initialize-stripe:
 *   post:
 *     summary: Initialize Stripe payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - amount
 *             properties:
 *               bookingId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Stripe Session URL generated
 */
router.post('/initialize-stripe', protect, initializeStripe);
router.get('/stripe-success', stripeSuccess);
router.get('/stripe-cancel', stripeCancel);


module.exports = router;
