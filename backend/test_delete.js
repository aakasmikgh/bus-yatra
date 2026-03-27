const mongoose = require('mongoose');
require('dotenv').config();
const Banner = require('./models/Banner');
const cloudinary = require('./config/cloudinary');

async function testDelete() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const banner = await Banner.findOne();
        if (!banner) {
            console.log('No banners found to delete.');
            process.exit(0);
        }

        console.log(`Testing deletion for banner ID: ${banner._id}`);
        console.log(`Public ID: ${banner.public_id}`);

        // Simulate logic from controller
        try {
            console.log('Attempting Cloudinary destroy...');
            const result = await cloudinary.uploader.destroy(banner.public_id);
            console.log('Cloudinary response:', result);
        } catch (cloErr) {
            console.error('Cloudinary error:', cloErr);
        }

        console.log('Attempting DB delete...');
        const deleted = await Banner.findByIdAndDelete(banner._id);
        console.log('DB delete result:', deleted ? 'Success' : 'Failed');

        process.exit(0);
    } catch (err) {
        console.error('Overall error:', err);
        process.exit(1);
    }
}

testDelete();
