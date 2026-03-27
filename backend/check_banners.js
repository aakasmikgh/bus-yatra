const mongoose = require('mongoose');
require('dotenv').config();
const Banner = require('./models/Banner');

const fs = require('fs');

async function checkBanners() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const banners = await Banner.find();
        let output = 'Banner Data:\n';
        banners.forEach(b => {
            output += `ID: ${b._id}, Name: ${b.name}, public_id: ${b.public_id}\n`;
        });
        fs.writeFileSync('banner_data.txt', output);
        console.log('Results saved to banner_data.txt');
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('banner_data.txt', err.stack);
        process.exit(1);
    }
}

checkBanners();
