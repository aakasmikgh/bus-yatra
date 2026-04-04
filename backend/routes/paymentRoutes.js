const express = require('express');
const {
    initializeKhalti,
    verifyKhalti,
    initializeStripe,
    stripeSuccess,
    stripeCancel
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/payment/initialize-khalti:
 *   post:
 *     summary: Initialize Khalti payment
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
 *               appRedirectUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Khalti URL generated
 */
router.post('/initialize-khalti', protect, initializeKhalti);

/**
 * @swagger
 * /api/payment/verify-khalti:
 *   get:
 *     summary: Verify Khalti payment
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: pidx
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verified
 */
router.get('/verify-khalti', verifyKhalti);



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
