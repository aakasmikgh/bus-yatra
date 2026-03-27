const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    public_id: {
        type: String,
        required: true
    },
    showOnHome: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Banner', BannerSchema);
