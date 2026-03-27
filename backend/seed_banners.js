const mongoose = require('mongoose');
require('dotenv').config();
const Banner = require('./models/Banner');

async function seedBanners() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Clear existing (it should be empty anyway)
        await Banner.deleteMany({});
        
        const banners = [
            {
                name: 'Banner 1',
                imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa',
                public_id: 'test/banner1',
                showOnHome: true
            },
            {
                name: 'Banner 2',
                imageUrl: 'https://images.unsplash.com/photo-1546944065-2bxAoXcfwwM',
                public_id: 'test/banner2',
                showOnHome: true
            },
            {
                name: 'Banner 3',
                imageUrl: 'https://images.unsplash.com/photo-1581432130383-7dfd4db6c72e',
                public_id: 'test/banner3',
                showOnHome: false
            }
        ];
        
        await Banner.insertMany(banners);
        console.log('Seed successful! 3 banners added.');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}

seedBanners();
