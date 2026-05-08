const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const Booking = require('./models/Booking');

async function fixBookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const res = await Booking.updateMany(
      { status: 'Pending' },
      { $set: { status: 'Confirmed' } }
    );
    console.log(`Successfully updated ${res.modifiedCount} Pending bookings to Confirmed.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixBookings();
