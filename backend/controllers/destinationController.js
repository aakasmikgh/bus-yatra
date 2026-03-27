const Destination = require('../models/Destination');

// @desc    Get all destinations
// @route   GET /api/destinations
// @access  Public (for mobile)
exports.getDestinations = async (req, res, next) => {
    try {
        const destinations = await Destination.find({ status: 'Active' }).sort('name');
        res.status(200).json({
            success: true,
            count: destinations.length,
            data: destinations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get all destinations (including inactive) for Admin
// @route   GET /api/destinations/admin
// @access  Private/Admin
exports.getAdminDestinations = async (req, res, next) => {
    try {
        const destinations = await Destination.find().sort('name');
        res.status(200).json({
            success: true,
            count: destinations.length,
            data: destinations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Create new destination
// @route   POST /api/destinations
// @access  Private/Admin
exports.createDestination = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (name) {
            // Delete existing destination with same name if it exists
            await Destination.findOneAndDelete({ name: name.trim() });
        }

        const destination = await Destination.create(req.body);
        res.status(201).json({
            success: true,
            data: destination
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Update destination
// @route   PUT /api/destinations/:id
// @access  Private/Admin
exports.updateDestination = async (req, res, next) => {
    try {
        const destination = await Destination.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!destination) {
            return res.status(404).json({ success: false, error: 'Destination not found' });
        }

        res.status(200).json({
            success: true,
            data: destination
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Delete destination
// @route   DELETE /api/destinations/:id
// @access  Private/Admin
exports.deleteDestination = async (req, res, next) => {
    try {
        const destination = await Destination.findByIdAndDelete(req.params.id);

        if (!destination) {
            return res.status(404).json({ success: false, error: 'Destination not found' });
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
// @desc    Create multiple destinations
// @route   POST /api/destinations/bulk
// @access  Private/Admin
exports.createDestinationsBulk = async (req, res, next) => {
    try {
        console.log('BULK CREATE REQUEST:', req.body);
        const { names } = req.body;

        if (!names || !Array.isArray(names)) {
            console.log('BULK CREATE FAIL: Invalid names array');
            return res.status(400).json({ success: false, error: 'Please provide an array of city names' });
        }

        const destinationObjects = names
            .filter(name => name && name.trim().length > 0)
            .map(name => ({ name: name.trim(), status: 'Active' }));

        console.log(`BULK CREATE: Attempting to insert ${destinationObjects.length} cities`);

        if (destinationObjects.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid city names provided' });
        }

        // Delete any existing destinations that are in this new list
        const nameList = destinationObjects.map(d => d.name);
        await Destination.deleteMany({ name: { $in: nameList } });

        try {
            const destinations = await Destination.insertMany(destinationObjects, { ordered: false });
            console.log('BULK CREATE SUCCESS:', destinations.length);
            res.status(201).json({
                success: true,
                count: destinations.length,
                data: destinations
            });
        } catch (insertError) {
            // Some might have succeeded even if it threw an error (due to ordered: false)
            console.log('BULK CREATE PARTIAL FAIL/DUPLICATES:', insertError.message);
            res.status(201).json({
                success: true,
                message: 'Bulk insert completed with some potential duplicates skipped',
                insertedCount: insertError.insertedDocs ? insertError.insertedDocs.length : 0
            });
        }
    } catch (error) {
        console.error('BULK CREATE SERVER ERROR:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error during bulk creation'
        });
    }
};
