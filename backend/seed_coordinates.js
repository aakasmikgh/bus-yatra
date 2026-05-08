const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Destination = require('./models/Destination');

dotenv.config();

const CITY_COORDS = {
    "Kathmandu": { lat: 27.7172, lng: 85.3240 },
    "Pokhara": { lat: 28.2095, lng: 83.9856 },
    "Baglung": { lat: 28.2721, lng: 83.6001 },
    "Butwal": { lat: 27.7006, lng: 83.4484 },
    "Biratnagar": { lat: 26.4525, lng: 87.2718 },
    "Narayanghat": { lat: 27.6833, lng: 84.4333 },
    "Hetauda": { lat: 27.4167, lng: 85.0333 },
    "Janakpur": { lat: 26.7333, lng: 85.9167 },
    "Dharan": { lat: 26.8125, lng: 87.2722 },
    "Itahari": { lat: 26.6667, lng: 87.2667 },
    "Birtamod": { lat: 26.6333, lng: 87.9833 },
};

const seedCoordinates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for Seeding Coordinates...');

        for (const [name, coords] of Object.entries(CITY_COORDS)) {
            await Destination.findOneAndUpdate(
                { name: new RegExp('^' + name + '$', 'i') },
                { latitude: coords.lat, longitude: coords.lng },
                { new: true }
            );
            console.log(`Updated ${name} with coordinates.`);
        }

        console.log('Finished seeding coordinates!');
        mongoose.connection.close();
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seedCoordinates();
