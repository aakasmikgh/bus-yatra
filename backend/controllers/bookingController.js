const Booking = require('../models/Booking');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');


// Helper to normalize dates to YYYY-MM-DD
const normalizeDate = (dateStr) => {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toISOString().split('T')[0];
    } catch (e) {
        return dateStr;
    }
};

// @desc    Get all booked seats for a route and date
// @route   GET /api/bookings/booked-seats
// @access  Public
exports.getBookedSeats = async (req, res, next) => {
    try {
        let { routeId, date } = req.query;

        if (!routeId || !date) {
            return res.status(400).json({
                success: false,
                error: 'Please provide routeId and date'
            });
        }

        const normalizedDate = normalizeDate(date);

        // 1. Fetch ALL confirmed bookings for this route and date
        const confirmedBookings = await Booking.find({
            route: routeId,
            bookingDate: normalizedDate,
            status: 'Confirmed'
        });

        // 2. Flatten all seats from all confirmed bookings
        const actualBookedSeats = confirmedBookings.reduce((acc, booking) => {
            return acc.concat(booking.seats.map(s => s.trim().toUpperCase()));
        }, []);

        // No longer using SeatAvailability for concurrency control as requested.
        // We calculate booked seats directly from the confirmed bookings.

        res.status(200).json({
            success: true,
            data: actualBookedSeats
        });
    } catch (error) {
        console.error('GetBookedSeats Error:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.user = req.user.id;

        let { route, bookingDate, seats } = req.body;
        if (!route || !bookingDate || !seats || seats.length === 0) {
            return res.status(400).json({ success: false, error: 'Missing route, bookingDate, or seats' });
        }

        // --- NORMALIZE INPUTS ---
        bookingDate = normalizeDate(bookingDate);
        seats = seats.map(s => s.trim().toUpperCase());
        req.body.bookingDate = bookingDate;
        req.body.seats = seats;

        // --- SIMPLE AVAILABILITY CHECK ---
        const existingBookings = await Booking.find({
            route,
            bookingDate,
            status: 'Confirmed'
        });

        const allBookedSeats = existingBookings.reduce((acc, b) => acc.concat(b.seats), []);
        const isAnySeatTaken = seats.some(seat => allBookedSeats.includes(seat));

        if (isAnySeatTaken) {
            return res.status(400).json({
                success: false,
                error: 'One or more selected seats are already booked. Please choose different seats.'
            });
        }
        // --- END SIMPLE CHECK ---

        // If a promo code was used, track it to prevent double-redemption
        if (req.body.promoCode) {
            const coupon = await Coupon.findOne({
                code: req.body.promoCode.toUpperCase(),
                isActive: true,
                expiryDate: { $gte: new Date() }
            });

            if (!coupon) {
                return res.status(400).json({ success: false, error: 'Invalid or expired promo code' });
            }

            if (coupon.usedBy.some(id => id.toString() === req.user.id)) {
                return res.status(400).json({ success: false, error: 'Promo code already redeemed' });
            }
        }

        let booking;
        try {
            booking = await Booking.create(req.body);
        } catch (bookingError) {

            throw bookingError;
        }
        console.log('New booking created:', booking._id);

        if (req.body.promoCode) {
            await Coupon.findOneAndUpdate(
                { code: req.body.promoCode.toUpperCase() },
                { $addToSet: { usedBy: req.user.id } }
            );
        }

        // Create Admin Notification
        try {
            await Notification.create({
                title: 'New Ticket Booking',
                message: `${req.body.contactName} has booked their ticket.`,
                type: 'BookingCreated'
            });
            console.log('Admin notification created for booking');
        } catch (err) {
            console.error('Failed to create admin notification:', err);
        }

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('CreateBooking Error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get my bookings
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate({
                path: 'route',
                populate: [
                    { path: 'origin', select: 'name' },
                    { path: 'destination', select: 'name' }
                ]
            })
            .populate('bus', 'name type')
            .sort('-createdAt');


        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res, next) => {
    console.log(`Updating booking status: ID=${req.params.id}, status=${req.body.status}`);
    try {
        const { status } = req.body;

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        // Check if user owns the booking
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to update this booking'
            });
        }

        booking.status = status;
        if (req.body.paymentMethod) {
            booking.paymentMethod = req.body.paymentMethod;
        }

        await booking.save();



        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('UpdateBookingStatus Error:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings/admin
// @access  Private/Admin
exports.getAllBookings = async (req, res, next) => {
    console.log('Admin: Fetching all bookings...');
    try {
        const bookings = await Booking.find()
            .populate('user', 'name email')
            .populate({
                path: 'route',
                populate: [
                    { path: 'origin', select: 'name' },
                    { path: 'destination', select: 'name' }
                ]
            })
            .populate('bus', 'name type')
            .sort('-createdAt');

        console.log(`Found ${bookings.length} bookings`);
        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('GetAllBookings Error:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('DeleteBooking Error:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get KNN seat recommendations for a user on a specific route
// @route   GET /api/bookings/recommend-seats
// @access  Private
exports.getSeatRecommendations = async (req, res, next) => {
    try {
        const { routeId, date } = req.query;
        if (!routeId || !date) {
            return res.status(400).json({ success: false, error: 'Please provide routeId and date' });
        }

        const User = require('../models/User'); // Fixed model loading
        const currentUser = await User.findById(req.user.id);
        
        if (!currentUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const normalizedDate = normalizeDate(date);

        // 1. Get ALL confirmed bookings for this route
        const historicalBookings = await Booking.find({ route: routeId, status: 'Confirmed' }).populate('user', 'age gender');
        
        let neighbors = [];
        
        // 2. Calculate Distance (KNN)
        historicalBookings.forEach(booking => {
            if (!booking.user || booking.user._id.toString() === req.user.id.toString()) return;

            let distance = 0;
            const age1 = currentUser.age || 30;
            const age2 = booking.user.age || 30;
            distance += Math.pow((age1 - age2) / 100, 2);

            const gender1 = currentUser.gender || 'Other';
            const gender2 = booking.user.gender || 'Other';
            if (gender1 !== gender2) distance += 0.5;

            distance = Math.sqrt(distance);

            neighbors.push({
                distance,
                seats: booking.seats
            });
        });

        // 3. Sort by nearest neighbors
        neighbors.sort((a, b) => a.distance - b.distance);
        const topNeighbors = neighbors.slice(0, 10);

        // Tally recommended seats
        let seatFrequency = {};
        topNeighbors.forEach(n => {
            n.seats.forEach(seat => {
                seatFrequency[seat] = (seatFrequency[seat] || 0) + 1;
            });
        });

        let recommendedSeats = Object.keys(seatFrequency).sort((a, b) => seatFrequency[b] - seatFrequency[a]);

        // 4. Filter out currently booked seats
        const confirmedNow = await Booking.find({ route: routeId, bookingDate: normalizedDate, status: 'Confirmed' });
        const currentlyBookedSeats = confirmedNow.reduce((acc, b) => acc.concat(b.seats), []);

        recommendedSeats = recommendedSeats.filter(seat => !currentlyBookedSeats.includes(seat));

        if (recommendedSeats.length === 0) {
            recommendedSeats = ['1A', '2A', '1B', '2B'].filter(seat => !currentlyBookedSeats.includes(seat));
        }

        res.status(200).json({
            success: true,
            data: recommendedSeats.slice(0, 2)
        });

    } catch (error) {
        console.error('KNN Recommendation Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
