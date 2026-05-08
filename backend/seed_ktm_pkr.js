const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Route = require('./models/Route');
const Destination = require('./models/Destination');
const Bus = require('./models/Bus');

dotenv.config();

const seedKtmPkr = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for Seeding...');

        // 1. Get Cities
        const ktm = await Destination.findOne({ name: 'Kathmandu' });
        const pkr = await Destination.findOne({ name: 'Pokhara' });

        if (!ktm || !pkr) {
            console.error('Please make sure Kathmandu and Pokhara exist in the DB first!');
            process.exit(1);
        }

        // 2. Get a Bus
        const bus = await Bus.findOne();
        if (!bus) {
            console.error('No buses found! Please add a bus first.');
            process.exit(1);
        }

        // 3. Clear existing KTM-PKR routes to avoid clutter
        await Route.deleteMany({ origin: ktm._id, destination: pkr._id });

        const routes = [
            {
                bus: bus._id,
                origin: ktm._id,
                destination: pkr._id,
                distance: 200,
                fare: 1000,
                availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                departureTime: '07:00 AM',
                arrivalTime: '02:00 PM',
                status: 'Active',
                roadCondition: 1.0, // Standard
                trafficDelay: 0      // No delay
            },
            {
                bus: bus._id,
                origin: ktm._id,
                destination: pkr._id,
                distance: 180, // Shorter
                fare: 1200,
                availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                departureTime: '08:00 AM',
                arrivalTime: '03:00 PM',
                status: 'Active',
                roadCondition: 1.8, // VERY ROUGH ROAD
                trafficDelay: 10
            },
            {
                bus: bus._id,
                origin: ktm._id,
                destination: pkr._id,
                distance: 200,
                fare: 900,
                availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                departureTime: '09:00 AM',
                arrivalTime: '05:00 PM',
                status: 'Active',
                roadCondition: 1.0,
                trafficDelay: 120 // HEAVY TRAFFIC (2 hours)
            },
            {
                bus: bus._id,
                origin: ktm._id,
                destination: pkr._id,
                distance: 210, // Longer distance
                fare: 1500,
                availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                departureTime: '06:00 AM',
                arrivalTime: '01:00 PM',
                status: 'Active',
                roadCondition: 0.8, // SUPER SMOOTH ROAD
                trafficDelay: 0
            },
            {
                bus: bus._id,
                origin: ktm._id,
                destination: pkr._id,
                distance: 190,
                fare: 1100,
                availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                departureTime: '10:00 AM',
                arrivalTime: '04:00 PM',
                status: 'Active',
                roadCondition: 1.2,
                trafficDelay: 30
            }
        ];

        await Route.insertMany(routes);
        console.log('Successfully seeded 5 diverse KTM -> PKR routes!');
        
        mongoose.connection.close();
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seedKtmPkr();
