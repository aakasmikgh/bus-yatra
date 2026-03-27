const Bus = require('../models/Bus');

// @desc    Get all buses
// @route   GET /api/buses
// @access  Private/Admin
exports.getBuses = async (req, res, next) => {
    try {
        const buses = await Bus.find().sort('-createdAt');
        res.status(200).json({
            success: true,
            count: buses.length,
            data: buses
        });
    } catch (error) {
        console.error('Error fetching buses:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Create new bus
// @route   POST /api/buses
// @access  Private/Admin
exports.createBus = async (req, res, next) => {
    try {
        let busData = { ...req.body };

        // Handle amenities if it comes as a string (multipart/form-data)
        if (typeof busData.amenities === 'string') {
            try {
                busData.amenities = JSON.parse(busData.amenities);
            } catch (e) {
                busData.amenities = busData.amenities.split(',').map(a => a.trim());
            }
        }

        // Handle image uploads from Cloudinary (using the new field name busImages)
        if (req.files && req.files.length > 0) {
            busData.images = req.files.map(file => file.path);
        }

        const bus = await Bus.create(busData);

        res.status(201).json({
            success: true,
            data: bus
        });
    } catch (error) {
        console.error('Bus Creation Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: 'Bus number already exists' });
        }
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Update bus
// @route   PUT /api/buses/:id
// @access  Private/Admin
exports.updateBus = async (req, res, next) => {
    try {
        let updateData = { ...req.body };

        // Handle amenities if it comes as a string
        if (typeof updateData.amenities === 'string') {
            try {
                updateData.amenities = JSON.parse(updateData.amenities);
            } catch (e) {
                updateData.amenities = updateData.amenities.split(',').map(a => a.trim());
            }
        }

        // Handle existing images array (was renamed to existingImages in frontend)
        if (typeof updateData.existingImages === 'string') {
            try {
                updateData.images = JSON.parse(updateData.existingImages);
            } catch (e) {
                updateData.images = [];
            }
        } else if (Array.isArray(updateData.images)) {
            // Already an array or not sent
        } else {
            updateData.images = [];
        }

        // Handle new image uploads from Cloudinary (using busImages field)
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path);
            updateData.images = [...(updateData.images || []), ...newImages];
        }

        // Remove existingImages field before saving to DB
        delete updateData.existingImages;

        const bus = await Bus.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!bus) {
            return res.status(404).json({ success: false, error: 'Bus not found' });
        }

        res.status(200).json({
            success: true,
            data: bus
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Delete bus
// @route   DELETE /api/buses/:id
// @access  Private/Admin
exports.deleteBus = async (req, res, next) => {
    try {
        const bus = await Bus.findByIdAndDelete(req.params.id);

        if (!bus) {
            return res.status(404).json({ success: false, error: 'Bus not found' });
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
