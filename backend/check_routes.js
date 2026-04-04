const mongoose = require('mongoose');
require('dotenv').config();
const Route = require('./models/Route');
const Destination = require('./models/Destination');
const Bus = require('./models/Bus');

const checkRoutes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
        
        const routes = await Route.find().populate('origin destination bus');
        console.log(`Total Routes: ${routes.length}`);
        
        routes.forEach((r, i) => {
            console.log(`Route ${i+1}: ${r.origin?.name || 'Unknown'} -> ${r.destination?.name || 'Unknown'}`);
            console.log(`  Bus: ${r.bus?.name || 'Unknown'}`);
            console.log(`  Boarding Points: ${JSON.stringify(r.boardingPoints)}`);
        });
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkRoutes();
