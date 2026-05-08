const mongoose = require('mongoose');
require('dotenv').config();
const Route = require('./models/Route');
const Destination = require('./models/Destination');
const Bus = require('./models/Bus');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        // 1. Create/Find Destinations
        const ktm = await Destination.findOneAndUpdate(
            { name: 'Kathmandu' },
            { name: 'Kathmandu', status: 'Active' },
            { upsert: true, new: true }
        );
        const pkr = await Destination.findOneAndUpdate(
            { name: 'Pokhara' },
            { name: 'Pokhara', status: 'Active' },
            { upsert: true, new: true }
        );
        const bgl = await Destination.findOneAndUpdate(
            { name: 'Baglung' },
            { name: 'Baglung', status: 'Active' },
            { upsert: true, new: true }
        );

        // 2. Find any bus to use
        let bus = await Bus.findOne();
        if (!bus) {
            bus = await Bus.create({
                name: 'Test Bus',
                number: 'BA 1 PA 1234',
                type: 'Deluxe',
                seats: 30,
                status: 'Active'
            });
        }

        // 3. Clear old routes for these cities
        await Route.deleteMany({
            origin: { $in: [ktm._id, pkr._id, bgl._id] },
            destination: { $in: [ktm._id, pkr._id, bgl._id] }
        });

        // 4. Create Multi-Hop Routes
        // KTM -> PKR
        await Route.create({
            bus: bus._id,
            origin: ktm._id,
            destination: pkr._id,
            departureTime: '07:00 AM',
            arrivalTime: '02:00 PM',
            fare: 1000,
            distance: 200,
            roadCondition: 1.5, // Construction at Mugling
            trafficDelay: 30,
            status: 'Active'
        });

        // PKR -> BGL
        await Route.create({
            bus: bus._id,
            origin: pkr._id,
            destination: bgl._id,
            departureTime: '03:00 PM',
            arrivalTime: '06:00 PM',
            fare: 500,
            distance: 75,
            roadCondition: 1.0,
            trafficDelay: 0,
            status: 'Active'
        });

        console.log('Successfully seeded multi-hop test data!');
        console.log('Try searching Kathmandu -> Baglung in the mobile app!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
