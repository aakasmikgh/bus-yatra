const mongoose = require('mongoose');
require('dotenv').config();
const Destination = require('./models/Destination');

const checkDestinations = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
        
        const count = await Destination.countDocuments();
        console.log(`Total Destinations: ${count}`);
        
        const activeCount = await Destination.countDocuments({ status: 'Active' });
        console.log(`Active Destinations: ${activeCount}`);
        
        if (count === 0) {
            console.log('No destinations found. Seeding some initial data...');
            const initialCities = ['Kathmandu', 'Pokhara', 'Chitwan', 'Butwal', 'Lumbini', 'Janakpur', 'Biratnagar', 'Dharan', 'Hetauda', 'Nepalgunj', 'Damak', 'Itahari'];
            await Destination.insertMany(initialCities.map(name => ({ name, status: 'Active' })));
            console.log('Initial destinations seeded successfully.');
        } else {
            const destinations = await Destination.find();
            console.log('Destinations in DB:', destinations.map(d => `${d.name} (${d.status})`));
        }
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkDestinations();
