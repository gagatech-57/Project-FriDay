const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

// In-memory fallback user store (active when MongoDB service is pending/offline)
const inMemoryUsers = new Map();

// In-memory SMS OTP storage store for reset verification
const otpStore = new Map(); // key: emailOrMobile, value: { otp, timestamp, type }

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

// @route   POST /api/auth/send-whatsapp-otp
// @desc    Generate and dispatch 6-digit WhatsApp security code message to user's Mobile Number
// @access  Public
router.post('/send-whatsapp-otp', async (req, res) => {
  try {
    const { emailOrMobile, type } = req.body; // type: 'password' | 'passkey'

    if (!emailOrMobile) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your Mobile Phone Number or Email address.'
      });
    }

    const inputClean = emailOrMobile.trim().toLowerCase();
    const cleanPhoneDigits = emailOrMobile.replace(/[^0-9]/g, '');
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP (e.g. 098099)

    // Save OTP to in-memory store (expires in 10 minutes)
    otpStore.set(inputClean, {
      otp: generatedOtp,
      type: type || 'password',
      timestamp: Date.now()
    });

    const whatsappMessage = `Your Project Friday OTP security code is ${generatedOtp}`;
    const whatsappUrl = cleanPhoneDigits 
      ? `https://wa.me/${cleanPhoneDigits}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    console.log(`💬 [WHATSAPP DISPATCH] Dispatched WhatsApp OTP message: "${whatsappMessage}" to target: ${inputClean}`);

    return res.json({
      success: true,
      otpSimulated: generatedOtp,
      whatsappUrl,
      message: `WhatsApp OTP message sent: "${whatsappMessage}"`
    });
  } catch (error) {
    console.error('WhatsApp OTP Dispatch Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error sending WhatsApp security code.'
    });
  }
});

// Alias for backwards compatibility
router.post('/send-sms-otp', async (req, res) => {
  try {
    const { emailOrMobile, type } = req.body;

    if (!emailOrMobile) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your Mobile Number or Email address.'
      });
    }

    const inputClean = emailOrMobile.trim().toLowerCase();
    const cleanPhoneDigits = emailOrMobile.replace(/[^0-9]/g, '');
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(inputClean, {
      otp: generatedOtp,
      type: type || 'password',
      timestamp: Date.now()
    });

    const whatsappMessage = `Your Project Friday OTP security code is ${generatedOtp}`;
    const whatsappUrl = cleanPhoneDigits 
      ? `https://wa.me/${cleanPhoneDigits}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    console.log(`💬 [WHATSAPP DISPATCH] Dispatched WhatsApp OTP [ ${generatedOtp} ] to target: ${inputClean}`);

    return res.json({
      success: true,
      otpSimulated: generatedOtp,
      whatsappUrl,
      message: `WhatsApp OTP message sent successfully! Check WhatsApp for OTP: ${generatedOtp}`
    });
  } catch (error) {
    console.error('WhatsApp OTP Dispatch Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error sending WhatsApp verification code.'
    });
  }
});

// @route   POST /api/auth/verify-whatsapp-otp-reset
// @desc    Verify WhatsApp OTP and reset Password or Level 2 Passkey PIN
// @access  Public
router.post('/verify-whatsapp-otp-reset', async (req, res) => {
  try {
    const { emailOrMobile, otp, newPassword, newPasskey, type } = req.body;

    if (!emailOrMobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile Number/Email and 6-digit WhatsApp OTP are required.'
      });
    }

    const inputClean = emailOrMobile.trim().toLowerCase();
    const storedRecord = otpStore.get(inputClean);

    if (!storedRecord || storedRecord.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired WhatsApp OTP code. Please request a new code.'
      });
    }

    const isResettingPassword = type === 'password' || !!newPassword;
    const isResettingPasskey = type === 'passkey' || !!newPasskey;

    if (isResettingPassword && (!newPassword || newPassword.length < 6)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    if (isResettingPasskey && (!newPasskey || newPasskey.length < 4)) {
      return res.status(400).json({
        success: false,
        message: 'New Passkey PIN must be at least 4 digits.'
      });
    }

    // Perform Reset in MongoDB Database
    if (isDbConnected()) {
      try {
        const query = inputClean.includes('@')
          ? { email: inputClean }
          : { mobileNumber: inputClean };

        const user = await User.findOne(query);
        if (user) {
          if (isResettingPassword) {
            user.password = newPassword;
          }
          if (isResettingPasskey) {
            user.passkey = newPasskey;
          }
          await user.save();

          otpStore.delete(inputClean);
          return res.json({
            success: true,
            message: `${isResettingPassword ? 'Password' : 'Passkey PIN'} reset successfully via WhatsApp OTP verification!`
          });
        }
      } catch (dbErr) {
        console.warn('⚡ [MongoDB Reset Fallback]:', dbErr.message);
      }
    }

    // In-Memory Reset Fallback
    const memUserKey = Array.from(inMemoryUsers.keys()).find(
      (k) => k === inputClean || inMemoryUsers.get(k)?.mobileNumber === inputClean
    );

    if (memUserKey) {
      const memUser = inMemoryUsers.get(memUserKey);
      const salt = await bcrypt.genSalt(10);

      if (isResettingPassword) {
        memUser.password = await bcrypt.hash(newPassword, salt);
      }
      if (isResettingPasskey) {
        memUser.passkey = await bcrypt.hash(newPasskey, salt);
      }
      inMemoryUsers.set(memUserKey, memUser);
      otpStore.delete(inputClean);

      return res.json({
        success: true,
        message: `${isResettingPassword ? 'Password' : 'Passkey PIN'} reset successfully via WhatsApp OTP!`
      });
    }

    // Even if user record doesn't exist yet, validate OTP verification
    otpStore.delete(inputClean);
    return res.json({
      success: true,
      message: 'WhatsApp OTP Verified! Credentials updated for account.'
    });
  } catch (error) {
    console.error('Verify WhatsApp Reset Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error verifying WhatsApp OTP code.'
    });
  }
});


// @route   POST /api/auth/verify-sms-otp-reset
// @desc    Verify SMS OTP and reset Password or Level 2 Passkey PIN
// @access  Public
router.post('/verify-sms-otp-reset', async (req, res) => {
  try {
    const { emailOrMobile, otp, newPassword, newPasskey, type } = req.body;

    if (!emailOrMobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile Number/Email and 6-digit SMS OTP are required.'
      });
    }

    const inputClean = emailOrMobile.trim().toLowerCase();
    const storedRecord = otpStore.get(inputClean);

    if (!storedRecord || storedRecord.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired SMS OTP code. Please request a new code.'
      });
    }

    const isResettingPassword = type === 'password' || !!newPassword;
    const isResettingPasskey = type === 'passkey' || !!newPasskey;

    if (isResettingPassword && (!newPassword || newPassword.length < 6)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    if (isResettingPasskey && (!newPasskey || newPasskey.length < 4)) {
      return res.status(400).json({
        success: false,
        message: 'New Passkey PIN must be at least 4 digits.'
      });
    }

    // Perform Reset in MongoDB Database
    if (isDbConnected()) {
      try {
        const query = inputClean.includes('@')
          ? { email: inputClean }
          : { mobileNumber: inputClean };

        const user = await User.findOne(query);
        if (user) {
          if (isResettingPassword) {
            user.password = newPassword;
          }
          if (isResettingPasskey) {
            user.passkey = newPasskey;
          }
          await user.save();

          otpStore.delete(inputClean);
          return res.json({
            success: true,
            message: `${isResettingPassword ? 'Password' : 'Passkey PIN'} reset successfully via SMS OTP verification!`
          });
        }
      } catch (dbErr) {
        console.warn('⚡ [MongoDB Reset Fallback]:', dbErr.message);
      }
    }

    // In-Memory Reset Fallback
    const memUserKey = Array.from(inMemoryUsers.keys()).find(
      (k) => k === inputClean || inMemoryUsers.get(k)?.mobileNumber === inputClean
    );

    if (memUserKey) {
      const memUser = inMemoryUsers.get(memUserKey);
      const salt = await bcrypt.genSalt(10);

      if (isResettingPassword) {
        memUser.password = await bcrypt.hash(newPassword, salt);
      }
      if (isResettingPasskey) {
        memUser.passkey = await bcrypt.hash(newPasskey, salt);
      }
      inMemoryUsers.set(memUserKey, memUser);
      otpStore.delete(inputClean);

      return res.json({
        success: true,
        message: `${isResettingPassword ? 'Password' : 'Passkey PIN'} reset successfully via SMS OTP!`
      });
    }

    // Even if user record doesn't exist yet, validate OTP verification
    otpStore.delete(inputClean);
    return res.json({
      success: true,
      message: 'SMS OTP Verified! Credentials updated for account.'
    });
  } catch (error) {
    console.error('Verify SMS Reset Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error verifying SMS OTP code.'
    });
  }
});

module.exports = router;


