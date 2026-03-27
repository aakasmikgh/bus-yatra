const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Comprehensive request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Mount routers
const auth = require('./routes/authRoutes');
const bus = require('./routes/busRoutes');
const destination = require('./routes/destinationRoutes');
const route = require('./routes/routeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const couponRoutes = require('./routes/couponRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const bannerRoutes = require('./routes/bannerRoutes');

app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', auth);
app.use('/api/buses', bus);
app.use('/api/destinations', destination);
app.use('/api/routes', route);
app.use('/api/bookings', bookingRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/banners', bannerRoutes);

app.get('/api/health-check', (req, res) => {
  res.json({ success: true, routes: ['notifications', 'auth', 'buses', 'destinations', 'routes', 'bookings', 'coupons', 'payment', 'analytics'] });
});

app.get('/', (req, res) => {
  res.send('Bus Ticketing System API is running...');
});

app.get('/api/ping', (req, res) => {
  res.json({ success: true, message: 'Server is updated and running!', version: 'V3-NOTIFICATIONS' });
});

// Cloudinary Test Route
const upload = require('./middleware/uploadMiddleware');
app.post('/api/test/upload', (req, res, next) => {
  req.uploadFolder = 'test';
  next();
}, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({
    success: true,
    message: 'Image uploaded successfully to Cloudinary!',
    url: req.file.path,
    public_id: req.file.filename
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('--- GLOBAL ERROR HANDLER ---');
  console.error(`Error: ${err.message}`);
  console.error('Stack:', err.stack);
  console.error('Request Body:', req.body);
  console.error('----------------------------');

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

// Catch-all route for 404s
app.use((req, res) => {
  const msg = `404 - Not Found: ${req.method} ${req.originalUrl}`;
  console.log(msg);
  res.status(404).json({ success: false, error: msg });
});

// Connect to Database and Start Server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
} else {
  // For Vercel serverless environment
  connectDB();
  module.exports = app;
}
