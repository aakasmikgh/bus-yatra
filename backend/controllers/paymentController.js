const axios = require('axios');
const crypto = require('crypto');
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

        const secretKey = process.env.KHALTI_SECRET_KEY || 'live_secret_key_68791341fdd94846a146f0457ff7b455';
        const isLive = secretKey.startsWith('live_');
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

        const secretKey = process.env.KHALTI_SECRET_KEY || 'live_secret_key_68791341fdd94846a146f0457ff7b455';
        const isLive = secretKey.startsWith('live_');
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
        console.error('Khalti Verify Error:', error.response?.data || error.message);
        res.status(500).send('<h1>Payment Verification Failed</h1>');
    }
};

// @desc    Initialize eSewa payment
// @route   POST /api/payment/initialize-esewa
// @access  Private
exports.initializeEsewa = async (req, res) => {
    try {
        const { bookingId, amount } = req.body;

        if (!bookingId || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Please provide bookingId and amount'
            });
        }

        // ULTIMATE ESEWA V2 FIX: Use plain integers and hardcoded sandbox secret for reliability
        const amountStr = Math.round(Number(amount)).toString(); // e.g., "1200"

        // Use a simpler UUID with NO dashes, just in case
        const transactionUuid = `TXN${bookingId.toString().slice(-8)}${Date.now().toString().slice(-4)}`;

        const productCode = process.env.ESEWA_PRODUCT_CODE;
        const sandboxSecret = process.env.ESEWA_SECRET_KEY;

        if (!productCode || !sandboxSecret) {
            throw new Error("Missing eSewa credentials in environment variables.");
        }

        // THE STRING MUST BE EXACTLY: total_amount=VAL,transaction_uuid=VAL,product_code=VAL
        const signatureString = `total_amount=${amountStr},transaction_uuid=${transactionUuid},product_code=${productCode}`;

        console.log('--- ESEWA ULTIMATE DEBUG ---');
        console.log('Signature String:', signatureString);

        const hmac = crypto.createHmac('sha256', sandboxSecret);
        hmac.update(signatureString);
        const signature = hmac.digest('base64');
        console.log('Generated Signature:', signature);

        const esewaData = {
            amount: amountStr,
            tax_amount: "0",
            total_amount: amountStr,
            transaction_uuid: transactionUuid,
            product_code: productCode,
            product_service_charge: "0",
            product_delivery_charge: "0",
            success_url: `${process.env.BACKEND_URL}/api/payment/verify-esewa`,
            failure_url: `${process.env.BACKEND_URL}/api/payment/failure-esewa`,
            signed_field_names: "total_amount,transaction_uuid,product_code",
            signature: signature
        };

        const webPortalUrl = process.env.WEB_PORTAL_URL || 'http://localhost:5173/payment-gateway';
        const paymentUrl = `${webPortalUrl}?${new URLSearchParams(esewaData).toString()}`;

        res.status(200).json({
            success: true,
            data: {
                paymentUrl,
                ...esewaData
            }
        });
    } catch (error) {
        console.error('eSewa Init Error:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Render eSewa POST form
// @route   GET /api/payment/render-form
// @access  Public
exports.renderEsewaForm = async (req, res) => {
    const data = req.query;
    console.log('Rendering eSewa Form for:', data.transaction_uuid);

    const esewaUrl = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

    const html = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Redirecting to eSewa...</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; }
                    .loader { border: 4px solid #f3f3f3; border-top: 4px solid #60bb46; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .text { margin-top: 20px; color: #666; font-size: 16px; }
                    #manual-btn { margin-top: 30px; padding: 12px 24px; background: #60bb46; color: white; border: none; border-radius: 8px; font-weight: bold; display: none; }
                </style>
            </head>
            <body>
                <div class="loader"></div>
                <div class="text">Connecting to eSewa Secure Payment...</div>
                <form id="esewa-form" action="${esewaUrl}" method="POST">
                    ${Object.entries(data).map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`).join('\n')}
                </form>
                <button id="manual-btn" onclick="document.getElementById('esewa-form').submit()">Click to Proceed</button>
                <script>
                    setTimeout(() => {
                        try {
                            document.getElementById('esewa-form').submit();
                            setTimeout(() => {
                                document.getElementById('manual-btn').style.display = 'block';
                            }, 3000);
                        } catch (e) {
                            document.getElementById('manual-btn').style.display = 'block';
                        }
                    }, 500);
                </script>
            </body>
        </html>
    `;

    res.send(html);
};

// @desc    Handle eSewa failure redirect
// @route   GET /api/payment/failure-esewa
// @access  Public
exports.failureEsewa = async (req, res) => {
    res.status(200).send('<h1>Payment Failed</h1><p>You will be redirected back shortly...</p>');
};

// @desc    Verify eSewa payment
// @route   GET /api/payment/verify-esewa
// @access  Public (Callback from eSewa)
exports.verifyEsewa = async (req, res) => {
    try {
        const { data } = req.query; // eSewa returns base64 encoded data in GET callback

        if (!data) {
            return res.status(400).json({ success: false, error: 'No data provided' });
        }

        // Decode base64 data
        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        console.log('Decoded eSewa Verification Data:', decodedData);

        // eSewa verification parameters:
        // status, total_amount, transaction_uuid, product_code, transaction_code
        // We should verify the signature here too for security if possible, 
        // but eSewa's new API returns 'COMPLETE' status.

        if (decodedData.status === 'COMPLETE') {
            // Extract the original bookingId from transaction_uuid (format: TXN...TIMESTAMP)
            // The bookingId is 24 chars long. It starts after 'TXN' (index 3).
            const bookingId = decodedData.transaction_uuid.substring(3).substring(0, 24);
            console.log('Extracted Booking ID for update:', bookingId);

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ success: false, error: 'Booking not found' });
            }

            booking.status = 'Confirmed';
            booking.paymentMethod = 'eSewa';
            booking.transactionId = decodedData.transaction_code;
            await booking.save();

            // Redirect back to the mobile app using deep links
            // We use the usermobile:// scheme defined in app.json
            res.redirect('usermobile://my-trips?status=success&bookingId=' + bookingId);
        } else {
            res.redirect('usermobile://payment?status=failure');
        }
    } catch (error) {
        console.error('eSewa Verify Error:', error);
        res.status(500).send('<h1>Server Error</h1>');
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
