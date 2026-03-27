const express = require('express');
const { getBuses, createBus, updateBus, deleteBus } = require('../controllers/busController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Protect and authorize all routes below
router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/buses:
 *   get:
 *     summary: Get all buses
 *     tags: [Buses]
 *     responses:
 *       200:
 *         description: List of buses
 *   post:
 *     summary: Create a new bus
 *     tags: [Buses]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               number:
 *                 type: string
 *               type:
 *                 type: string
 *               seats:
 *                 type: integer
 *               amenities:
 *                 type: string
 *               busImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Bus created successfully
 */
router.get('/', getBuses);
router.post('/', (req, res, next) => {
    req.uploadFolder = 'buses';
    next();
}, upload.array('busImages', 5), createBus);

router.put('/:id', (req, res, next) => {
    req.uploadFolder = 'buses';
    next();
}, upload.array('busImages', 5), updateBus);
router.delete('/:id', deleteBus);

module.exports = router;
