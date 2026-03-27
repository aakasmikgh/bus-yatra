const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    route: {
        type: mongoose.Schema.ObjectId,
        ref: 'Route',
        required: true
    },
    bus: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bus',
        required: true
    },
    seats: {
        type: [String],
        required: [true, 'Please select at least one seat']
    },
    bookingDate: {
        type: String,
        required: [true, 'Please provide a booking date']
    },
    totalPrice: {
        type: Number,
        required: true
    },
    contactName: {
        type: String,
        required: [true, 'Please provide a passenger name']
    },
    contactPhone: {
        type: String,
        required: [true, 'Please provide a phone number']
    },
    contactEmail: {
        type: String,
        required: [true, 'Please provide an email address']
    },
    boardingPoint: {
        type: String,
        required: [true, 'Please select a boarding point']
    },
    paymentMethod: {
        type: String,
        default: 'Cash'
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    status: {
        type: String,
        enum: ['Confirmed', 'Cancelled', 'Pending'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

bookingSchema.pre('save', function () {
    if (this.seats && Array.isArray(this.seats)) {
        this.seats = this.seats.map(s => s.trim());
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
