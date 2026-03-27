const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please add a coupon code'],
        unique: true,
        trim: true,
        uppercase: true
    },
    title: {
        type: String,
        required: [true, 'Please add a coupon title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a coupon description'],
        trim: true
    },
    discountType: {
        type: String,
        required: [true, 'Please specify discount type'],
        enum: ['Percentage', 'Cash']
    },
    discountValue: {
        type: Number,
        required: [true, 'Please add a discount value']
    },
    expiryDate: {
        type: Date,
        required: [true, 'Please add an expiry date']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usedBy: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Coupon', couponSchema);
