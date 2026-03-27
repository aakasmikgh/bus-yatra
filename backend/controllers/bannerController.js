const Banner = require('../models/Banner');
const cloudinary = require('../config/cloudinary');

// @desc    Upload new banner
// @route   POST /api/banners/upload
// @access  Private/Admin
exports.uploadBanner = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload an image' });
        }

        const { name } = req.body;

        const banner = await Banner.create({
            name,
            imageUrl: req.file.path,
            public_id: req.file.filename,
            showOnHome: false
        });

        res.status(201).json({
            success: true,
            data: banner
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get all banners
// @route   GET /api/banners
// @access  Private/Admin
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort('-createdAt');
        res.status(200).json({
            success: true,
            count: banners.length,
            data: banners
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get banners for home screen and viewer
// @route   GET /api/banners/active
// @access  Public
exports.getActiveBanners = async (req, res) => {
    try {
        // Return all banners, but sort so that active ones (showOnHome: true) are at the front
        // This allows the mobile app to show 2 thumbnails while having all banners for the viewer
        const banners = await Banner.find().sort({ showOnHome: -1, createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: banners.length,
            data: banners
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Toggle banner home status
// @route   PATCH /api/banners/:id/toggle-home
// @access  Private/Admin
exports.toggleHomeStatus = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({ success: false, error: 'Banner not found' });
        }

        // Check if we are trying to enable and already have 2
        if (!banner.showOnHome) {
            const activeCount = await Banner.countDocuments({ showOnHome: true });
            if (activeCount >= 2) {
                return res.status(400).json({
                    success: false,
                    error: 'You can only show 2 banners on the home screen. Please disable another one first.'
                });
            }
        }

        banner.showOnHome = !banner.showOnHome;
        await banner.save();

        res.status(200).json({
            success: true,
            data: banner
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
exports.deleteBanner = async (req, res) => {
    try {
        console.log(`Initialing delete for banner ID: ${req.params.id}`);
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            console.log(`Banner with ID ${req.params.id} not found in DB`);
            return res.status(404).json({ success: false, error: 'Banner not found' });
        }

        console.log(`Found banner. Public ID: ${banner.public_id}. Deleting from Cloudinary...`);

        // Delete from Cloudinary
        try {
            const result = await cloudinary.uploader.destroy(banner.public_id);
            console.log('Cloudinary destroy result:', result);
        } catch (cloErr) {
            console.error('Cloudinary deletion failed:', cloErr);
            // We might still want to delete from DB if it's already gone from Cloudinary
        }

        console.log('Deleting from database...');
        // Delete from DB
        const deletedBanner = await Banner.findByIdAndDelete(req.params.id);
        console.log('Database deletion completed');

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error in deleteBanner:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
