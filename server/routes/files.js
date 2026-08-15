const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FileModel = require('../models/File');

// In-memory fallback file store (active when MongoDB service is offline)
const inMemoryFiles = [];

const isDbConnected = () => mongoose.connection.readyState === 1;

// @route   POST /api/files/upload
// @desc    Upload file to MongoDB database
// @access  Public
router.post('/upload', async (req, res) => {
  try {
    const { name, size, type, date, url, content, userEmail } = req.body;

    if (!name || !size || !type) {
      return res.status(400).json({
        success: false,
        message: 'File name, size, and type are required.'
      });
    }

    if (isDbConnected()) {
      try {
        const fileDoc = await FileModel.create({
          name,
          size,
          type,
          date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          url,
          content,
          userEmail: userEmail ? userEmail.toLowerCase() : null
        });

        return res.status(201).json({
          success: true,
          message: 'File saved to MongoDB database successfully!',
          file: {
            id: fileDoc._id.toString(),
            name: fileDoc.name,
            size: fileDoc.size,
            type: fileDoc.type,
            date: fileDoc.date,
            url: fileDoc.url,
            content: fileDoc.content
          }
        });
      } catch (dbErr) {
        console.warn('⚡ [MongoDB File Save Fallback]:', dbErr.message);
      }
    }

    // In-memory fallback
    const memFile = {
      id: 'mem_file_' + Date.now(),
      name,
      size,
      type,
      date: date || 'Just now',
      url,
      content,
      userEmail
    };

    inMemoryFiles.unshift(memFile);

    return res.status(201).json({
      success: true,
      message: 'File saved to local storage session!',
      file: memFile
    });
  } catch (error) {
    console.error('File Upload Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during file upload.'
    });
  }
});

// @route   GET /api/files
// @desc    Fetch files from MongoDB database
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;

    if (isDbConnected()) {
      try {
        const query = email ? { userEmail: email.toLowerCase() } : {};
        const dbFiles = await FileModel.find(query).sort({ createdAt: -1 });

        const formattedFiles = dbFiles.map((f) => ({
          id: f._id.toString(),
          name: f.name,
          size: f.size,
          type: f.type,
          date: f.date,
          url: f.url,
          content: f.content
        }));

        return res.json({
          success: true,
          files: formattedFiles
        });
      } catch (dbErr) {
        console.warn('⚡ [MongoDB File Fetch Fallback]:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      files: inMemoryFiles
    });
  } catch (error) {
    console.error('Fetch Files Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching files.'
    });
  }
});

// @route   DELETE /api/files/:id
// @desc    Delete file from MongoDB database
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const fileId = req.params.id;

    if (isDbConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(fileId)) {
          await FileModel.findByIdAndDelete(fileId);
          return res.json({
            success: true,
            message: 'File deleted from MongoDB database.'
          });
        }
      } catch (dbErr) {
        console.warn('⚡ [MongoDB File Delete Fallback]:', dbErr.message);
      }
    }

    // Delete from memory fallback
    const index = inMemoryFiles.findIndex((f) => f.id === fileId);
    if (index !== -1) {
      inMemoryFiles.splice(index, 1);
    }

    return res.json({
      success: true,
      message: 'File removed successfully.'
    });
  } catch (error) {
    console.error('Delete File Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting file.'
    });
  }
});

module.exports = router;
