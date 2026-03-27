const express = require('express');
const {
    getBookedSeats,
    createBooking,
    getMyBookings,
    getAllBookings,
    deleteBooking,
    updateBookingStatus,
    getSeatRecommendations
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/booked-seats', getBookedSeats);
router.get('/recommend-seats', protect, getSeatRecommendations);
router.get('/', getAllBookings); // GET /api/bookings
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.put('/:id/status', protect, updateBookingStatus);
router.delete('/:id', protect, deleteBooking); // DELETE /api/bookings/:id

module.exports = router;
