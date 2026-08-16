const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const FileModel = require('../models/File');

// In-memory fallback file store (active when MongoDB service is offline)
const inMemoryFiles = [];

const isDbConnected = () => mongoose.connection.readyState === 1;

// Helper to calculate checksum hash
const generateChecksum = (dataStr) => {
  if (!dataStr) return crypto.randomBytes(8).toString('hex');
  return crypto.createHash('sha256').update(dataStr).digest('hex').substring(0, 16);
};

// @route   POST /api/files/upload
// @desc    Upload file metadata & payload to MongoDB database
// @access  Public
router.post('/upload', async (req, res) => {
  try {
    const { name, size, type, date, url, content, userEmail, fileSizeBytes } = req.body;

    if (!name || !size || !type) {
      return res.status(400).json({
        success: false,
        message: 'File name, size, and type are required.'
      });
    }

    const payloadData = url || content || name;
    const checksum = generateChecksum(payloadData);
    const parsedSizeBytes = fileSizeBytes || (url ? Math.round((url.length * 3) / 4) : content ? content.length : 1024);

    if (isDbConnected()) {
      try {
        const fileDoc = await FileModel.create({
          name,
          size,
          fileSizeBytes: parsedSizeBytes,
          type,
          date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          checksum,
          storageType: 'metadata_vault',
          url,
          content,
          userEmail: userEmail ? userEmail.toLowerCase() : null
        });

        return res.status(201).json({
          success: true,
          message: 'File metadata & payload saved to MongoDB database successfully!',
          file: {
            id: fileDoc._id.toString(),
            name: fileDoc.name,
            size: fileDoc.size,
            fileSizeBytes: fileDoc.fileSizeBytes,
            type: fileDoc.type,
            date: fileDoc.date,
            checksum: fileDoc.checksum,
            storageType: fileDoc.storageType,
            userEmail: fileDoc.userEmail,
            hasContent: !!(fileDoc.url || fileDoc.content)
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
      fileSizeBytes: parsedSizeBytes,
      type,
      date: date || 'Just now',
      checksum,
      storageType: 'metadata_vault',
      url,
      content,
      userEmail,
      hasContent: !!(url || content)
    };

    inMemoryFiles.unshift(memFile);

    // Strip heavy payload from return file object for speed
    const memFileMeta = { ...memFile };
    delete memFileMeta.url;
    delete memFileMeta.content;

    return res.status(201).json({
      success: true,
      message: 'File saved to local storage session!',
      file: memFileMeta
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
// @desc    Fetch lightweight file METADATA (without heavy content/URL payloads for max speed)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;

    if (isDbConnected()) {
      try {
        const query = email ? { userEmail: email.toLowerCase() } : {};
        // EXCLUDE heavy 'url' and 'content' fields to ensure ultra-fast metadata response
        const dbFiles = await FileModel.find(query)
          .select('-url -content')
          .sort({ createdAt: -1 })
          .lean();

        const formattedFiles = dbFiles.map((f) => ({
          id: f._id.toString(),
          name: f.name,
          size: f.size,
          fileSizeBytes: f.fileSizeBytes || 0,
          type: f.type,
          date: f.date,
          checksum: f.checksum || 'a8f5f167f44f4964',
          storageType: f.storageType || 'metadata_vault',
          userEmail: f.userEmail,
          hasContent: true
        }));

        return res.json({
          success: true,
          files: formattedFiles
        });
      } catch (dbErr) {
        console.warn('⚡ [MongoDB File Fetch Fallback]:', dbErr.message);
      }
    }

    // Return in-memory metadata list without full base64 strings
    const formattedMemFiles = inMemoryFiles.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      fileSizeBytes: f.fileSizeBytes || 0,
      type: f.type,
      date: f.date,
      checksum: f.checksum || 'a8f5f167f44f4964',
      storageType: f.storageType || 'metadata_vault',
      userEmail: f.userEmail,
      hasContent: !!(f.url || f.content)
    }));

    return res.json({
      success: true,
      files: formattedMemFiles
    });
  } catch (error) {
    console.error('Fetch Files Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching files.'
    });
  }
});

// @route   GET /api/files/:id/content
// @desc    Lazily load heavy file payload (URL/Content) for Previewing or Downloading
// @access  Public
router.get('/:id/content', async (req, res) => {
  try {
    const fileId = req.params.id;

    if (isDbConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(fileId)) {
          const fileDoc = await FileModel.findById(fileId).lean();
          if (fileDoc) {
            return res.json({
              success: true,
              id: fileDoc._id.toString(),
              name: fileDoc.name,
              size: fileDoc.size,
              type: fileDoc.type,
              url: fileDoc.url,
              content: fileDoc.content,
              checksum: fileDoc.checksum
            });
          }
        }
      } catch (dbErr) {
        console.warn('⚡ [MongoDB Content Fetch Fallback]:', dbErr.message);
      }
    }

    // Search in-memory store
    const memFile = inMemoryFiles.find((f) => f.id === fileId);
    if (memFile) {
      return res.json({
        success: true,
        id: memFile.id,
        name: memFile.name,
        size: memFile.size,
        type: memFile.type,
        url: memFile.url,
        content: memFile.content,
        checksum: memFile.checksum
      });
    }

    return res.status(404).json({
      success: false,
      message: 'File content payload not found.'
    });
  } catch (error) {
    console.error('Fetch Content Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching file content.'
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

