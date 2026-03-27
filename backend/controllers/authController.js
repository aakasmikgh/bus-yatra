const User = require('../models/User');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, phone } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                error: 'User already exists with this email'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role,
            phone,
            isApproved: role === 'admin' ? false : true
        });

        // Create Admin Notification
        try {
            await Notification.create({
                title: 'New Member',
                message: `${name} has created a new account.`,
                type: 'UserCreated'
            });
            console.log(`Admin notification created for new user: ${name}`);
        } catch (err) {
            console.error('Failed to create admin notification for user:', err);
        }

        sendTokenResponse(user, 201, res);
    } catch (error) {
        let errorMessage = error.message;

        // Mongoose validation error
        if (error.name === 'ValidationError') {
            errorMessage = Object.values(error.errors).map(val => val.message).join(', ');
        }

        res.status(400).json({
            success: false,
            error: errorMessage
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Admin Login
// @route   POST /api/auth/admin-login
// @access  Public
exports.adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', email, password);
        const SUPER_ADMIN_EMAIL = 'admin@yatra.com';
        const SUPER_ADMIN_PASSWORD = 'adminpassword123';

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }

        // Super Admin Logic
        if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
            let user = await User.findOne({ email: SUPER_ADMIN_EMAIL });
            if (!user) {
                user = await User.create({
                    name: 'Super Admin',
                    email: SUPER_ADMIN_EMAIL,
                    password: SUPER_ADMIN_PASSWORD,
                    role: 'admin',
                    isApproved: true
                });
            }
            return sendTokenResponse(user, 200, res);
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied. You are not an admin.' });
        }

        // Check approval
        if (user.isApproved === false) {
            return res.status(403).json({ success: false, error: 'Wait for super admin to approve' });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
    try {
        console.log('GET /api/auth/users reached');
        const users = await User.find();
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Update user
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
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

// @desc    Approve user (admin only)
// @route   PUT /api/auth/users/:id/approve
// @access  Private/Admin
exports.approveUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Update user profile (Self)
// @route   PUT /api/auth/updateMe
// @access  Private
exports.updateMe = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone
        };

        if (req.body.age) fieldsToUpdate.age = Number(req.body.age);
        if (req.body.gender) fieldsToUpdate.gender = req.body.gender;

        if (req.file) {
            fieldsToUpdate.profileImage = req.file.path;
        }

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone || '',
                profileImage: user.profileImage || '',
                age: user.age,
                gender: user.gender
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone || '',
            profileImage: user.profileImage || '',
            age: user.age,
            gender: user.gender
        }
    });
};
