const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    bus: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bus',
        required: [true, 'Please add a bus']
    },
    origin: {
        type: mongoose.Schema.ObjectId,
        ref: 'Destination',
        required: [true, 'Please add an origin']
    },
    destination: {
        type: mongoose.Schema.ObjectId,
        ref: 'Destination',
        required: [true, 'Please add a destination']
    },
    departureTime: {
        type: String,
        required: [true, 'Please add departure time']
    },
    arrivalTime: {
        type: String,
        required: [true, 'Please add arrival time']
    },
    fare: {
        type: Number,
        required: [true, 'Please add fare']
    },
    distance: {
        type: Number
    },
    boardingPoints: {
        type: [String],
        default: []
    },
    availableDays: {
        type: [String],
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

routeSchema.index({ origin: 1, destination: 1, availableDays: 1 });

module.exports = mongoose.model('Route', routeSchema);
