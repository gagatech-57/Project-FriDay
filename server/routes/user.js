const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/user/profile - Fetch user profile information
router.get('/profile', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query parameter is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await User.findOne({ email: cleanEmail }).select('-password -passkey');
      if (user) {
        return res.json({
          success: true,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username || user.email.split('@')[0],
            themePreference: user.themePreference || 'light',
            isEmailVerified: user.isEmailVerified !== false,
            createdAt: user.createdAt
          }
        });
      }
    }

    return res.json({
      success: true,
      user: {
        id: 'mem_user',
        name: 'Guna',
        email: cleanEmail,
        username: cleanEmail.split('@')[0],
        themePreference: 'light',
        isEmailVerified: true,
        createdAt: new Date()
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/user/profile - Update profile details
router.put('/profile', async (req, res) => {
  try {
    const { email, name, username } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (user) {
        if (name) user.name = name.trim();
        if (username) user.username = username.trim();
        await user.save();

        return res.json({
          success: true,
          message: 'Profile updated successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            themePreference: user.themePreference
          }
        });
      }
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully (Session)',
      user: { name, email: cleanEmail, username }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/user/settings - Update theme preference
router.put('/settings', async (req, res) => {
  try {
    const { email, themePreference } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (user) {
        if (themePreference) user.themePreference = themePreference;
        await user.save();
      }
    }

    return res.json({
      success: true,
      message: 'Settings updated successfully',
      themePreference: themePreference || 'light'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
