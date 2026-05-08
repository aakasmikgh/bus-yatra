const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');

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
            
            const booking = await Booking.findById(bookingId);
            if (booking) {
                console.log(`Found booking ${bookingId}`);
                booking.transactionId = session_id;
                booking.paymentMethod = 'Stripe';
                await booking.save();
                console.log(`Booking ${bookingId} payment tracked by Stripe.`);
            } else {
                console.error(`Booking ${bookingId} not found in Stripe callback!`);
            }

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
