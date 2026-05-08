const mongoose = require('mongoose');
const Route = require('./models/Route');
const Destination = require('./models/Destination');

async function checkRoutes() {
    try {
        await mongoose.connect('mongodb://localhost:27017/bus-ticketing');
        console.log('Connected to DB');
        
        const routes = await Route.find({ status: 'Active' })
            .populate('origin', 'name')
            .populate('destination', 'name');
            
        console.log(`Found ${routes.length} active routes`);
        routes.slice(0, 5).forEach(r => {
            console.log(`- ${r.origin?.name} -> ${r.destination?.name} (${r.availableDays})`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRoutes();
