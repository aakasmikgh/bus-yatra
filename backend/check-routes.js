const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Route = require('./models/Route');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const routes = await Route.find().populate('origin', 'name').populate('destination', 'name');
    
    routes.forEach(r => {
        if (r.origin && r.destination) {
            console.log(`Route: ${r.origin.name} -> ${r.destination.name} | Time: ${r.departureTime}`);
        }
    });

    process.exit(0);
}

check();
