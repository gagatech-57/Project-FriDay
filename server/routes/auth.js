const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'friday_secret_fallback', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (Name, Email, Password, Passkey)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, passkey } = req.body;

    if (!name || !email || !password || !passkey) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: Name, Email, Password, and Passkey.'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      passkey
    });

    if (user) {
      const token = generateToken(user._id);
      return res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user data provided.'
      });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error during registration.'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate Email & Password
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both Email and Password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      return res.json({
        success: true,
        requirePasskey: true,
        message: 'Password verified. Passkey authentication required.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error during authentication.'
    });
  }
});

// @route   POST /api/auth/verify-passkey
// @desc    Verify secondary Passkey for vault unlock
// @access  Public
router.post('/verify-passkey', async (req, res) => {
  try {
    const { email, passkey } = req.body;

    if (!email || !passkey) {
      return res.status(400).json({
        success: false,
        message: 'Email and Passkey are required for verification.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const isMatch = await user.matchPasskey(passkey);

    if (isMatch) {
      return res.json({
        success: true,
        passkeyVerified: true,
        message: 'Passkey verified! Vault access granted.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Invalid Passkey entered.'
      });
    }
  } catch (error) {
    console.error('Passkey Verification Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error during passkey verification.'
    });
  }
});

module.exports = router;
