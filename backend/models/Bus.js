const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a bus name']
    },
    number: {
        type: String,
        required: [true, 'Please add a bus number'],
        unique: true
    },
    type: {
        type: String,
        required: [true, 'Please select a bus type'],
        enum: ['Sleeper', 'Sofa-Seater', 'Super Deluxe', 'Non-AC', 'AC']
    },
    seats: {
        type: Number,
        required: [true, 'Please add total seats'],
        default: 40
    },
    amenities: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    images: {
        type: [String],
        default: []
    },
}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model('Bus', busSchema);
