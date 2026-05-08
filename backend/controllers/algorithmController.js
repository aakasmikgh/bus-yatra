const { spawn } = require('child_process');
const path = require('path');
const Route = require('../models/Route');

// @desc    Get Optimized Route using Dijkstra & A*
// @route   GET /api/v1/routes/optimize
// @access  Public
exports.getOptimizedRoute = async (req, res, next) => {
    try {
        const { startCity, endCity, day, date } = req.query;

        console.log(`[ALGO] Request: ${startCity} -> ${endCity} (${day}, ${date})`);

        if (!startCity || !endCity) {
            return res.status(400).json({ success: false, error: 'Please provide startCity and endCity' });
        }

        // 1. Get all routes for that day
        const query = { status: 'Active' };
        if (day) {
            query.availableDays = day;
        }

        let routes = await Route.find(query)
            .populate('origin', 'name')
            .populate('destination', 'name')
            .populate('bus', 'name number');

        console.log(`[ALGO] Found ${routes.length} total routes in DB`);

        // 2. Filter out PAST buses if searching for TODAY
        if (date && date !== 'undefined') {
            const searchDateObj = new Date(date);
            const today = new Date();
            if (searchDateObj.toDateString() === today.toDateString()) {
                routes = routes.filter(route => {
                    const timeStr = route.departureTime;
                    if (!timeStr) return true;
                    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                    if (timeMatch) {
                        let hours = parseInt(timeMatch[1], 10);
                        const minutes = parseInt(timeMatch[2], 10);
                        const period = timeMatch[3];
                        if (period) {
                            if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                            if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
                        }
                        const departureDate = new Date();
                        departureDate.setHours(hours, minutes, 0, 0);
                        return departureDate > today;
                    }
                    return true;
                });
            }
        }

        // 3. Format for Python
        const validRoutes = routes.filter(r => r.origin && r.destination);
        const formattedRoutes = validRoutes.map(r => ({
            id: r._id,
            originName: r.origin.name,
            destinationName: r.destination.name,
            distance: r.distance || 100,
            roadCondition: r.roadCondition || 1.0,
            trafficDelay: r.trafficDelay || 0,
            busName: r.bus?.name || 'Bus',
            busNumber: r.bus?.number || 'N/A'
        }));

        if (formattedRoutes.length === 0) {
            console.log('[ALGO] No valid routes found. Returning empty.');
            return res.status(200).json({
                success: true,
                data: {
                    dijkstra: { distance: null, path: [], routeIds: [] },
                    a_star: { weighted_score: null, path: [], routeIds: [] }
                }
            });
        }

        // 4. Spawn Python process
        const pythonScriptPath = path.join(__dirname, '..', 'algorithms', 'routing_engine.py');
        const pythonProcess = spawn('python', [pythonScriptPath]);

        let resultData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            resultData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            console.log(`[ALGO] Python finished with code ${code}`);
            if (code !== 0) {
                console.error('[ALGO] Python Error:', errorData);
                return res.status(500).json({ success: false, error: 'Algorithm calculation failed' });
            }

            try {
                const result = JSON.parse(resultData);
                if (result.error) {
                    console.error('[ALGO] Python Script Error:', result.error);
                    return res.status(500).json({ success: false, error: result.error });
                }
                res.status(200).json({ success: true, data: result });
            } catch (err) {
                console.error('[ALGO] Parse Error:', err, resultData);
                res.status(500).json({ success: false, error: 'Failed to parse AI suggestion' });
            }
        });

        // Send input
        const inputStr = JSON.stringify({
            routes: formattedRoutes,
            start: startCity,
            end: endCity
        });
        pythonProcess.stdin.write(inputStr);
        pythonProcess.stdin.end();

    } catch (error) {
        console.error('ALGORITHM CONTROLLER CRITICAL ERROR:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    }
};
