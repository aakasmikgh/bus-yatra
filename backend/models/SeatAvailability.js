const mongoose = require('mongoose');

const seatAvailabilitySchema = new mongoose.Schema({
    route: {
        type: mongoose.Schema.ObjectId,
        ref: 'Route',
        required: true
    },
    bookingDate: {
        type: String,
        required: true
    },
    bookedSeats: {
        type: [String],
        default: []
    }
});

// Create a compound unique index to quickly look up availability by route and date
seatAvailabilitySchema.index({ route: 1, bookingDate: 1 }, { unique: true });

module.exports = mongoose.model('SeatAvailability', seatAvailabilitySchema);
