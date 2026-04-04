const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');

// @desc    Initialize Khalti payment
// @route   POST /api/payment/initialize-khalti
// @access  Private
exports.initializeKhalti = async (req, res) => {
    try {
        const { bookingId, amount, appRedirectUrl } = req.body;

        if (!bookingId || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Please provide bookingId and amount'
            });
        }

        const khaltiPayload = {
            return_url: `${process.env.BACKEND_URL}/api/payment/verify-khalti?app_url=${encodeURIComponent(appRedirectUrl || 'usermobile://')}`,
            website_url: process.env.BACKEND_URL,
            amount: Math.round(Number(amount) * 100), // Amount in paisa
            purchase_order_id: bookingId,
            purchase_order_name: `Bus Ticket Booking - ${bookingId}`,
            customer_info: {
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone ? req.user.phone.replace(/\D/g, '').slice(-10) : '9800000000'
            }
        };

        // Sanitize the key to remove accidental spaces or hidden characters from .env
        const secretKey = (process.env.KHALTI_SECRET_KEY || 'test_secret_key_68791341fdd94846a146f0457ff7b455').trim();
        
        // Use explicit environment variable if present, otherwise detect from key
        const isLive = process.env.KHALTI_IS_LIVE === 'true' || secretKey.startsWith('live_');
        const baseUrl = isLive ? 'https://khalti.com/api/v2' : 'https://dev.khalti.com/api/v2';

        const response = await axios.post(
            `${baseUrl}/epayment/initiate/`,
            khaltiPayload,
            {
                headers: {
                    'Authorization': `Key ${secretKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data && response.data.payment_url) {
            // Update the booking method to Khalti immediately
            await Booking.findByIdAndUpdate(bookingId, { paymentMethod: 'Khalti' });

            res.status(200).json({
                success: true,
                data: {
                    paymentUrl: response.data.payment_url,
                    pidx: response.data.pidx
                }
            });
        } else {
            throw new Error('Failed to get payment URL from Khalti');
        }
    } catch (error) {
        console.error('--- KHALTI INIT ERROR ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
        res.status(500).json({
            success: false,
            error: error.response?.data?.detail || error.message || 'Khalti initialization failed'
        });
    }
};

// @desc    Verify Khalti payment
// @route   GET /api/payment/verify-khalti
// @access  Public (Callback from Khalti)
exports.verifyKhalti = async (req, res) => {
    try {
        const { pidx, purchase_order_id, status, app_url } = req.query;

        if (!pidx || status !== 'Completed') {
            return res.redirect(`${app_url || 'usermobile://'}/payment?status=failure`);
        }

        const secretKey = process.env.KHALTI_SECRET_KEY || 'test_secret_key_68791341fdd94846a146f0457ff7b455';
        const isLive = process.env.KHALTI_IS_LIVE === 'true' || secretKey.startsWith('live_');
        const baseUrl = isLive ? 'https://khalti.com/api/v2' : 'https://dev.khalti.com/api/v2';

        // Verify with Khalti lookup API
        const response = await axios.post(
            `${baseUrl}/epayment/lookup/`,
            { pidx },
            {
                headers: {
                    'Authorization': `Key ${secretKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data && response.data.status === 'Completed') {
            const bookingId = purchase_order_id;
            const booking = await Booking.findById(bookingId);

            if (!booking) {
                return res.status(404).send('Booking not found');
            }

            booking.status = 'Confirmed';
            booking.paymentMethod = 'Khalti';
            booking.transactionId = pidx;
            await booking.save();

            res.redirect(`${app_url || 'usermobile://'}/my-trips?status=success&bookingId=${bookingId}`);
        } else {
            res.redirect(`${app_url || 'usermobile://'}/payment?status=failure`);
        }
    } catch (error) {
        console.error('--- KHALTI VERIFY ERROR ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
        res.status(500).send(`<h1>Payment Verification Failed</h1><p>${error.response?.data?.detail || error.message}</p>`);
    }
};



// @desc    Initialize Stripe payment
// @route   POST /api/payment/initialize-stripe
// @access  Private
exports.initializeStripe = async (req, res) => {
    try {
        const { bookingId, amount } = req.body;

        if (!bookingId || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Please provide bookingId and amount'
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'npr', // Stripe technically supports NPR
                    product_data: {
                        name: 'Bus Ticket Booking',
                        description: `Booking ID: ${bookingId}`,
                    },
                    unit_amount: Math.round(Number(amount) * 100), // Stripe works in cents/paisa
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.BACKEND_URL}/api/payment/stripe-success?session_id={CHECKOUT_SESSION_ID}&bookingId=${bookingId}`,
            cancel_url: `${process.env.BACKEND_URL}/api/payment/stripe-cancel`,
        });

        // Update the booking method to Stripe immediately so it doesn't show "Cash"
        await Booking.findByIdAndUpdate(bookingId, { paymentMethod: 'Stripe' });

        res.status(200).json({
            success: true,
            data: {
                paymentUrl: session.url,
                sessionId: session.id
            }
        });
    } catch (error) {
        console.error('Stripe Init Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Stripe initialization failed'
        });
    }
};

// @desc    Stripe Success Redirect
// @route   GET /api/payment/stripe-success
// @access  Public
exports.stripeSuccess = async (req, res) => {
    try {
        const { session_id, bookingId } = req.query;
        console.log(`Stripe Success Callback: Session=${session_id}, Booking=${bookingId}`);

        const session = await stripe.checkout.sessions.retrieve(session_id);
        console.log(`Stripe Session Status: ${session.payment_status}`);

        if (session.payment_status === 'paid') {
            console.log(`Payment confirmed by Stripe for Session: ${session_id}`);
            // The user requested removing the auto-confirmed status update logic here
            // because they will handle the UI/Trips flow manually in the app later.

            res.send(`
                <html>
                    <body style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #f0f7ff;">
                        <div style="text-align: center; padding: 20px; border-radius: 20px; background: white; shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <h1 style="color: #007AFF;">Payment Successful</h1>
                            <p>Loading your trips...</p>
                            <!-- Detection string for WebView: STRIPE_PAYMENT_SUCCESS -->
                            <div style="display:none;">STRIPE_PAYMENT_SUCCESS</div>
                        </div>
                    </body>
                </html>
            `);
        } else {
            res.send('<html><body><h1>Payment Failed</h1><div style="display:none;">STRIPE_PAYMENT_FAILURE</div></body></html>');
        }
    } catch (error) {
        console.error('Stripe Success Error:', error);
        res.send('<html><body><h1>Error Processing Payment</h1></body></html>');
    }
};

// @desc    Stripe Cancel Redirect
// @route   GET /api/payment/stripe-cancel
// @access  Public
exports.stripeCancel = async (req, res) => {
    res.send('<html><body><h1>Payment Cancelled</h1><div style="display:none;">STRIPE_PAYMENT_CANCEL</div></body></html>');
};
