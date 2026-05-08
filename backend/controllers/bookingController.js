const Booking = require('../models/Booking');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');



// Helper to normalize dates to YYYY-MM-DD
const normalizeDate = (dateStr) => {
    try {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        
        // If it's already YYYY-MM-DD, just return it
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        
        // Use local components to avoid UTC shift
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return dateStr;
    }
};

// @desc    Get all booked seats for a route and date
// @route   GET /api/bookings/booked-seats
// @access  Public
exports.getBookedSeats = async (req, res, next) => {
    try {
        let { busId, date } = req.query;

        if (!busId || !date) {
            return res.status(400).json({
                success: false,
                error: 'Please provide busId and date'
            });
        }

        const normalizedDate = normalizeDate(date);
        console.log(`[Sync Debug] BookedSeats Request - Bus: ${busId}, Date: ${normalizedDate}`);

        // Broad Search Diagnosis (for final confirmation in logs)
        const allDateBookings = await Booking.find({ bookingDate: normalizedDate });
        console.log(`[Sync Debug] Broad Date Check: Found ${allDateBookings.length} total bookings on ${normalizedDate}.`);

        // Fetch bookings for this PHYSICAL BUS and date (Admin Panel Style)
        let queryBusId;
        try {
            const cleanBusId = String(busId).trim();
            if (cleanBusId === 'undefined' || !mongoose.Types.ObjectId.isValid(cleanBusId)) {
                console.error(`[Sync Debug] Invalid Bus ID: ${busId}`);
                return res.status(200).json({ success: true, data: [] }); // Return empty for bad ID to prevent crash
            }
            queryBusId = new mongoose.Types.ObjectId(cleanBusId);
        } catch (e) {
            return res.status(200).json({ success: true, data: [] });
        }

        const confirmedBookings = await Booking.find({
            bus: queryBusId,
            bookingDate: normalizedDate
        }).populate('bus', 'name number series');

        console.log(`[Sync Debug] Query Result - Found ${confirmedBookings.length} booking records for Bus ID: ${queryBusId}`);

        // 2. Flatten all seats from confirmed bookings and HEAL them to pure numbers
        const actualBookedSeats = confirmedBookings.reduce((acc, booking) => {
            const busLabel = booking.bus ? `${booking.bus.name} (${booking.bus.number})` : 'Unknown Bus';
            console.log(`[Sync Debug]   - Booking ${booking._id}: Bus: ${busLabel}, Seats: [${booking.seats.join(', ')}], Status: ${booking.status}`);
            
            // Extract numbers only to heal legacy A13/B3 into 13/3
            const healedSeats = booking.seats.map(s => {
                const numMatch = s.match(/\d+/);
                return numMatch ? numMatch[0] : s.trim().toUpperCase();
            });
            
            return acc.concat(healedSeats);
        }, []);

        console.log(`[Sync Debug] Total Healed Booked Seats (Numeric): [${actualBookedSeats.join(', ')}]`);

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

        // --- SIMPLE AVAILABILITY CHECK (Check ALL bookings) ---
        let checkRouteId = route;
        try {
            if (mongoose.Types.ObjectId.isValid(route)) {
                checkRouteId = new mongoose.Types.ObjectId(route);
            }
        } catch (e) {}

        const existingBookings = await Booking.find({
            route: checkRouteId,
            bookingDate
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

        // Normalize seats to pure numbers (no prefixes) for DB storage
        const healedSeats = (seats || []).map(s => {
            const numMatch = String(s).match(/\d+/);
            return numMatch ? numMatch[0] : String(s).trim().toUpperCase();
        });
        req.body.seats = healedSeats;

        console.log(`[Sync Debug] Creating Booking - Route: ${route}, Date: ${bookingDate}, Healed Seats: [${healedSeats.join(', ')}]`);

        let booking;
        try {
            booking = await Booking.create(req.body);
        } catch (bookingError) {
            console.error('[Sync Debug] Booking Creation Failed:', bookingError.message);
            throw bookingError;
        }
        console.log(`[Sync Debug] Booking Saved - ID: ${booking._id}, Saved Date: ${booking.bookingDate}`);

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

