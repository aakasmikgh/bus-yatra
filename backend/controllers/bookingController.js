const Booking = require('../models/Booking');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const SeatAvailability = require('../models/SeatAvailability');

// @desc    Get all booked seats for a route and date
// @route   GET /api/bookings/booked-seats
// @access  Public
exports.getBookedSeats = async (req, res, next) => {
    try {
        const { routeId, date } = req.query;

        if (!routeId || !date) {
            return res.status(400).json({
                success: false,
                error: 'Please provide routeId and date'
            });
        }

        const bookings = await Booking.find({
            route: routeId,
            bookingDate: date,
            status: 'Confirmed'
        });

        // Flatten all seats from all bookings into a single array
        const bookedSeats = bookings.reduce((acc, booking) => {
            return acc.concat(booking.seats.map(s => s.trim()));
        }, []);

        res.status(200).json({
            success: true,
            data: bookedSeats
        });
    } catch (error) {
        console.error(error);
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

        const { route, bookingDate, seats } = req.body;
        if (!route || !bookingDate || !seats || seats.length === 0) {
            return res.status(400).json({ success: false, error: 'Missing route, bookingDate, or seats' });
        }

        // --- ATOMIC CONCURRENCY CONTROL ---
        await SeatAvailability.updateOne(
            { route, bookingDate },
            { $setOnInsert: { route, bookingDate, bookedSeats: [] } },
            { upsert: true }
        );

        const lock = await SeatAvailability.findOneAndUpdate(
            {
                route,
                bookingDate,
                bookedSeats: { $nin: seats }
            },
            {
                $push: { bookedSeats: { $each: seats } }
            },
            { new: true }
        );

        if (!lock) {
            return res.status(409).json({
                success: false,
                error: 'CONCURRENCY ERROR: One or more selected seats were just instantly booked by another user. Please select different seats.'
            });
        }
        // --- END ATOMIC CONTROL ---

        // If a promo code was used, track it to prevent double-redemption
        if (req.body.promoCode) {
            const coupon = await Coupon.findOne({
                code: req.body.promoCode.toUpperCase(),
                isActive: true,
                expiryDate: { $gte: new Date() }
            });

            if (!coupon) {
                await SeatAvailability.updateOne({ route, bookingDate }, { $pullAll: { bookedSeats: seats } });
                return res.status(400).json({ success: false, error: 'Invalid or expired promo code' });
            }

            if (coupon.usedBy.some(id => id.toString() === req.user.id)) {
                await SeatAvailability.updateOne({ route, bookingDate }, { $pullAll: { bookedSeats: seats } });
                return res.status(400).json({ success: false, error: 'Promo code already redeemed' });
            }

            // Note: We update the coupon usage AFTER successfully creating the booking
        }

        let booking;
        try {
            booking = await Booking.create(req.body);
        } catch (bookingError) {
            await SeatAvailability.updateOne({ route, bookingDate }, { $pullAll: { bookedSeats: seats } });
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
        console.error(error);
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

        if (status === 'Cancelled') {
            const SeatAvailability = require('../models/SeatAvailability');
            // Assuming booking.bookingDate exists, wait, it's travelDate in Booking? No, bookingDate.
             await SeatAvailability.updateOne(
                { route: booking.route, bookingDate: booking.bookingDate },
                { $pullAll: { bookedSeats: booking.seats } }
            );
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error(error);
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
        console.error(error);
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

        const mongoose = require('mongoose');
        const Booking = mongoose.model('Booking');
        const User = mongoose.model('User');
        const currentUser = await User.findById(req.user.id);
        
        if (!currentUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

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
        const currentBookings = await Booking.find({ route: routeId, bookingDate: date, status: 'Confirmed' });
        const currentlyBookedSeats = currentBookings.reduce((acc, b) => acc.concat(b.seats), []);

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
