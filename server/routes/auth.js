const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

// In-memory fallback user store (active when MongoDB service is pending/offline)
const inMemoryUsers = new Map();

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'friday_secret_fallback', {
    expiresIn: '30d'
  });
};

// Check if MongoDB connection is active
const isDbConnected = () => mongoose.connection.readyState === 1;

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

    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      try {
        const userExists = await User.findOne({ email: cleanEmail });
        if (userExists) {
          return res.status(400).json({
            success: false,
            message: 'An account with this email address already exists.'
          });
        }

        const user = await User.create({
          name,
          email: cleanEmail,
          password,
          passkey
        });

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
      } catch (dbError) {
        console.warn('⚡ [MongoDB fallback] Falling back to in-memory store:', dbError.message);
      }
    }

    // In-Memory Fallback
    if (inMemoryUsers.has(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const hashedPasskey = await bcrypt.hash(passkey, salt);
    const userId = 'mem_' + Date.now();

    const newUser = {
      id: userId,
      name,
      email: cleanEmail,
      password: hashedPassword,
      passkey: hashedPasskey
    };

    inMemoryUsers.set(cleanEmail, newUser);
    const token = generateToken(userId);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! (Local Session)',
      token,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email
      }
    });
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

    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      try {
        const user = await User.findOne({ email: cleanEmail });
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
        }
      } catch (dbError) {
        console.warn('⚡ [MongoDB fallback] Falling back to in-memory store:', dbError.message);
      }
    }

    // In-Memory Fallback
    const memUser = inMemoryUsers.get(cleanEmail);
    if (memUser && (await bcrypt.compare(password, memUser.password))) {
      const token = generateToken(memUser.id);
      return res.json({
        success: true,
        requirePasskey: true,
        message: 'Password verified. Passkey authentication required.',
        token,
        user: {
          id: memUser.id,
          name: memUser.name,
          email: memUser.email
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.'
    });
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

    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      try {
        const user = await User.findOne({ email: cleanEmail });
        if (user) {
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
          }
        }
      } catch (dbError) {
        console.warn('⚡ [MongoDB fallback] Falling back to in-memory store:', dbError.message);
      }
    }

    // In-Memory Fallback
    const memUser = inMemoryUsers.get(cleanEmail);
    if (memUser) {
      const isMatch = await bcrypt.compare(passkey, memUser.passkey);
      if (isMatch) {
        return res.json({
          success: true,
          passkeyVerified: true,
          message: 'Passkey verified! Vault access granted.',
          user: {
            id: memUser.id,
            name: memUser.name,
            email: memUser.email
          }
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Access Denied: Invalid Passkey entered.'
    });
  } catch (error) {
    console.error('Passkey Verification Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error during passkey verification.'
    });
  }
});

module.exports = router;

