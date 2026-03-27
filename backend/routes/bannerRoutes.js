const express = require('express');
const router = express.Router();
const {
    uploadBanner,
    getBanners,
    getActiveBanners,
    toggleHomeStatus,
    deleteBanner
} = require('../controllers/bannerController');
const upload = require('../middleware/uploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/active', getActiveBanners);

// Protected Admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/', getBanners);
router.post('/upload', (req, res, next) => {
    req.uploadFolder = 'banners';
    next();
}, upload.single('image'), uploadBanner);
router.patch('/:id/toggle-home', toggleHomeStatus);
router.delete('/:id', deleteBanner);

module.exports = router;
