const Route = require('../models/Route');
const Destination = require('../models/Destination');

// @desc    Get all routes
// @route   GET /api/routes
// @access  Public (for mobile)
exports.getRoutes = async (req, res, next) => {
    try {
        const routes = await Route.find({ status: 'Active' })
            .populate('bus', 'name number type amenities seats images')
            .populate('origin', 'name')
            .populate('destination', 'name');

        res.status(200).json({
            success: true,
            count: routes.length,
            data: routes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get all routes for admin (includes inactive)
// @route   GET /api/routes/admin
// @access  Private/Admin
exports.getAdminRoutes = async (req, res, next) => {
    try {
        const routes = await Route.find()
            .populate('bus')
            .populate('origin', 'name')
            .populate('destination', 'name');

        res.status(200).json({
            success: true,
            count: routes.length,
            data: routes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Create new route
// @route   POST /api/routes
// @access  Private/Admin
exports.createRoute = async (req, res, next) => {
    try {
        const route = await Route.create(req.body);

        // Populate the created route to return full data
        const populatedRoute = await Route.findById(route._id)
            .populate('bus')
            .populate('origin', 'name')
            .populate('destination', 'name');

        res.status(201).json({
            success: true,
            data: populatedRoute
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private/Admin
exports.updateRoute = async (req, res, next) => {
    try {
        const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('bus', 'name number type amenities seats images')
            .populate('origin', 'name')
            .populate('destination', 'name');

        if (!route) {
            return res.status(404).json({ success: false, error: 'Route not found' });
        }

        res.status(200).json({
            success: true,
            data: route
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Search routes
// @route   GET /api/routes/search
// @access  Public
exports.searchRoutes = async (req, res, next) => {
    try {
        const { from, to, day, date } = req.query;

        let query = { status: 'Active' };

        // 1. Find matching origin destinations and use their ObjectIds
        if (from) {
            const originDestinations = await Destination.find({
                name: { $regex: from, $options: 'i' }
            }).select('_id');
            query.origin = { $in: originDestinations.map(d => d._id) };
        }

        // 2. Find matching target destinations and use their ObjectIds
        if (to) {
            const targetDestinations = await Destination.find({
                name: { $regex: to, $options: 'i' }
            }).select('_id');
            query.destination = { $in: targetDestinations.map(d => d._id) };
        }

        // 3. Match available days
        if (day) {
            query.availableDays = day;
        }

        // 4. Let MongoDB B-Tree index handle the filtering efficiently
        let routes = await Route.find(query)
            .populate('bus', 'name number type amenities seats images')
            .populate('origin', 'name')
            .populate('destination', 'name');

        // 5. Filter out PAST buses if the search date is TODAY
        if (date) {
            const searchDateObj = new Date(date);
            const today = new Date();

            // To avoid timezone shift issues between the mobile app (en-GB string) and strictly UTC server times:
            const searchDateStr = searchDateObj.toDateString(); // e.g. "Fri Mar 27 2026"
            const todayStr = today.toDateString();              // e.g. "Fri Mar 27 2026"
            
            console.log(`[TIME-FILTER] App requested date: "${date}" -> Parsed: ${searchDateStr}. Server today: ${todayStr}`);

            // Check if user is explicitly searching for *today's* buses
            if (searchDateStr === todayStr) {
                console.log(`[TIME-FILTER] Activating same-day past-departure filter.`);
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

                        // Create Date object for this departure time today
                        const departureDate = new Date();
                        departureDate.setHours(hours, minutes, 0, 0);

                        // Keep the route if departure is strictly AT or AFTER current theoretical time
                        // We subtract 5 minutes of grace period if needed, but strictly > today works well.
                        return departureDate > today;
                    }
                    return true;
                });
            }
        }

        res.status(200).json({
            success: true,
            count: routes.length,
            data: routes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error: ' + error.message
        });
    }
};

// @desc    Get single route by ID
// @route   GET /api/routes/:id
// @access  Public
exports.getRoute = async (req, res, next) => {
    try {
        const route = await Route.findById(req.params.id)
            .populate('bus', 'name number type amenities seats images')
            .populate('origin', 'name')
            .populate('destination', 'name');

        if (!route) {
            return res.status(404).json({
                success: false,
                error: 'Route not found'
            });
        }

        res.status(200).json({
            success: true,
            data: route
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error: ' + error.message
        });
    }
};

// @desc    Delete route
// @route   DELETE /api/routes/:id
// @access  Private/Admin
exports.deleteRoute = async (req, res, next) => {
    try {
        const route = await Route.findByIdAndDelete(req.params.id);

        if (!route) {
            return res.status(404).json({ success: false, error: 'Route not found' });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};
