const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const Destination = require('../models/Destination');

const router = express.Router();

// @desc    Find nearest bus stop
// @route   GET /api/spatial/nearest-stop
// @access  Public
router.get('/nearest-stop', async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, error: 'Please provide lat and lng' });
        }

        // 1. Fetch all destinations with coordinates
        const destinations = await Destination.find({ 
            latitude: { $exists: true }, 
            longitude: { $exists: true } 
        });

        if (destinations.length === 0) {
            return res.status(404).json({ success: false, error: 'No bus stops found with coordinates' });
        }

        const stops = destinations.map(d => ({
            name: d.name,
            lat: d.latitude,
            lng: d.longitude
        }));

        // 2. Call Python Spatial Engine
        const pythonProcess = spawn('python', [
            path.join(__dirname, '../algorithms/spatial_engine.py')
        ]);

        let resultData = '';

        pythonProcess.stdin.write(JSON.stringify({
            userLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
            stops: stops
        }));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
            resultData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            try {
                const parsedResult = JSON.parse(resultData);
                res.json(parsedResult);
            } catch (err) {
                res.status(500).json({ success: false, error: 'Failed to parse spatial engine output' });
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
