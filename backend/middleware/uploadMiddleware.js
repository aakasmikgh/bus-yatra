const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Determine folder based on route or request
        const folder = req.uploadFolder || 'misc';
        return {
            folder: `bus-yatra/${folder}`,
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`
        };
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
