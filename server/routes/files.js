const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const multer = require('multer');
const { Readable } = require('stream');
const FileModel = require('../models/File');

// Configure Multer for streaming memory buffer uploads (500MB max limit)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB max file size
});

// In-memory fallback file store (active when MongoDB service is offline)
const inMemoryFiles = [];

const isDbConnected = () => mongoose.connection.readyState === 1;

// GridFS Bucket Instance Manager
let gridfsBucket = null;
function getGridFSBucket() {
  if (!gridfsBucket && isDbConnected()) {
    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
  }
  return gridfsBucket;
}

// Helper to calculate checksum hash
const generateChecksum = (bufferOrStr) => {
  if (!bufferOrStr) return crypto.randomBytes(8).toString('hex');
  return crypto.createHash('sha256').update(bufferOrStr).digest('hex').substring(0, 16);
};

// Helper to infer MIME type from file extension
function getMimeType(filename, fallbackMime = 'application/octet-stream') {
  if (!filename) return fallbackMime;
  const ext = filename.split('.').pop().toLowerCase();
  const mimeMap = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    txt: 'text/plain',
    json: 'application/json',
    js: 'text/javascript',
    jsx: 'text/javascript',
    html: 'text/html',
    css: 'text/css',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return mimeMap[ext] || fallbackMime;
}

// Helper to format human-readable size
function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// @route   POST /api/files/upload
// @desc    Upload file to MongoDB GridFS with Metadata (Supports Multipart & JSON payload)
// @access  Public
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    let filename, sizeStr, typeStr, dateStr, userEmailStr, bufferData, mimeTypeStr, parsedSizeBytes;

    if (req.file) {
      // 1. Multipart Form Upload (FormData stream via Multer)
      filename = req.file.originalname;
      bufferData = req.file.buffer;
      mimeTypeStr = req.file.mimetype || getMimeType(filename);
      parsedSizeBytes = req.file.size;
      sizeStr = req.body.size || formatBytes(parsedSizeBytes);
      typeStr = req.body.type || 'doc';
      dateStr = req.body.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      userEmailStr = req.body.userEmail ? req.body.userEmail.toLowerCase() : null;
    } else {
      // 2. JSON Base64 Data URL or Text Payload (Backwards Compatibility)
      const { name, size, type, date, url, content, userEmail, fileSizeBytes } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'File name is required for upload.'
        });
      }

      filename = name;
      sizeStr = size || '1.0 MB';
      typeStr = type || 'doc';
      dateStr = date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      userEmailStr = userEmail ? userEmail.toLowerCase() : null;

      if (url && url.startsWith('data:')) {
        const matches = url.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeTypeStr = matches[1];
          bufferData = Buffer.from(matches[2], 'base64');
        } else {
          mimeTypeStr = getMimeType(filename);
          bufferData = Buffer.from(url);
        }
      } else if (content) {
        mimeTypeStr = getMimeType(filename, 'text/plain');
        bufferData = Buffer.from(content, 'utf-8');
      } else {
        mimeTypeStr = getMimeType(filename);
        bufferData = Buffer.from(`[PROJECT FRIDAY PAYLOAD] ${filename}`);
      }

      parsedSizeBytes = fileSizeBytes || bufferData.length;
      sizeStr = size || formatBytes(parsedSizeBytes);
    }

    const checksum = generateChecksum(bufferData);

    if (isDbConnected()) {
      try {
        const bucket = getGridFSBucket();
        if (!bucket) {
          throw new Error('GridFS Bucket initialization pending');
        }

        // Create Readable Stream from Buffer for GridFS Upload
        const bufferStream = new Readable();
        bufferStream.push(bufferData);
        bufferStream.push(null);

        // Open GridFS Upload Stream
        const uploadStream = bucket.openUploadStream(filename, {
          contentType: mimeTypeStr,
          metadata: {
            userEmail: userEmailStr,
            originalName: filename,
            uploadDate: new Date()
          }
        });

        // Stream binary data into GridFS bucket chunks
        await new Promise((resolve, reject) => {
          bufferStream.pipe(uploadStream)
            .on('error', reject)
            .on('finish', resolve);
        });

        const gridFsId = uploadStream.id;

        // Save lightweight Metadata Record in normal MongoDB Collection
        const fileDoc = await FileModel.create({
          name: filename,
          size: sizeStr,
          fileSizeBytes: parsedSizeBytes,
          type: typeStr,
          mimeType: mimeTypeStr,
          gridFsId: gridFsId,
          date: dateStr,
          checksum,
          storageType: 'gridfs',
          url: `/api/files/${gridFsId}/stream`,
          content: null,
          userEmail: userEmailStr
        });

        return res.status(201).json({
          success: true,
          message: 'File stored into MongoDB GridFS vault successfully!',
          file: {
            id: fileDoc._id.toString(),
            gridFsId: gridFsId.toString(),
            name: fileDoc.name,
            size: fileDoc.size,
            fileSizeBytes: fileDoc.fileSizeBytes,
            type: fileDoc.type,
            mimeType: fileDoc.mimeType,
            date: fileDoc.date,
            checksum: fileDoc.checksum,
            storageType: fileDoc.storageType,
            userEmail: fileDoc.userEmail,
            hasContent: true
          }
        });
      } catch (dbErr) {
        console.warn('⚡ [MongoDB GridFS Save Fallback]:', dbErr.message);
      }
    }

    // In-memory fallback (if DB service is offline)
    const memFile = {
      id: 'mem_file_' + Date.now(),
      name: filename,
      size: sizeStr,
      fileSizeBytes: parsedSizeBytes,
      type: typeStr,
      mimeType: mimeTypeStr,
      date: dateStr || 'Just now',
      checksum,
      storageType: 'inline',
      buffer: bufferData,
      userEmail: userEmailStr,
      hasContent: true
    };

    inMemoryFiles.unshift(memFile);

    return res.status(201).json({
      success: true,
      message: 'File saved to session memory store.',
      file: {
        id: memFile.id,
        name: memFile.name,
        size: memFile.size,
        fileSizeBytes: memFile.fileSizeBytes,
        type: memFile.type,
        mimeType: memFile.mimeType,
        date: memFile.date,
        checksum: memFile.checksum,
        storageType: memFile.storageType,
        userEmail: memFile.userEmail,
        hasContent: true
      }
    });
  } catch (error) {
    console.error('File Upload Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during file upload.'
    });
  }
});

// @route   GET /api/files
// @desc    Fetch lightweight file METADATA list (fast query, no heavy content payloads)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { email, view = 'all' } = req.query;

    if (isDbConnected()) {
      try {
        const query = {};
        if (email) query.userEmail = email.toLowerCase();

        if (view === 'trash') {
          query.isDeleted = true;
        } else {
          query.isDeleted = { $ne: true };
          if (view === 'favorites') {
            query.isFavorite = true;
          }
        }

        let sortOption = { createdAt: -1 };
        if (view === 'recent') {
          sortOption = { updatedAt: -1, createdAt: -1 };
        }

        const dbFiles = await FileModel.find(query)
          .select('-content')
          .sort(sortOption)
          .lean();

        const formattedFiles = dbFiles.map((f) => ({
          id: f._id.toString(),
          gridFsId: f.gridFsId ? f.gridFsId.toString() : null,
          name: f.name,
          size: f.size,
          fileSizeBytes: f.fileSizeBytes || 0,
          type: f.type,
          mimeType: f.mimeType || getMimeType(f.name),
          date: f.date,
          checksum: f.checksum || 'a8f5f167f44f4964',
          storageType: f.storageType || 'gridfs',
          userEmail: f.userEmail,
          isFavorite: f.isFavorite || false,
          isDeleted: f.isDeleted || false,
          deletedAt: f.deletedAt || null,
          shareToken: f.shareToken || null,
          hasContent: true,
          url: `/api/files/${f._id}/stream`,
          downloadUrl: `/api/files/${f._id}/download`,
          streamUrl: `/api/files/${f._id}/stream`
        }));

        return res.json({
          success: true,
          files: formattedFiles
        });
      } catch (dbErr) {
        console.warn('⚡ [MongoDB File Fetch Fallback]:', dbErr.message);
      }
    }

    // In-memory list
    let filteredMem = inMemoryFiles.filter((f) => {
      if (email && f.userEmail !== email.toLowerCase()) return false;
      if (view === 'trash') return f.isDeleted === true;
      if (f.isDeleted === true) return false;
      if (view === 'favorites') return f.isFavorite === true;
      return true;
    });

    const formattedMemFiles = filteredMem.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      fileSizeBytes: f.fileSizeBytes || 0,
      type: f.type,
      mimeType: f.mimeType || getMimeType(f.name),
      date: f.date,
      checksum: f.checksum || 'a8f5f167f44f4964',
      storageType: f.storageType || 'inline',
      userEmail: f.userEmail,
      isFavorite: f.isFavorite || false,
      isDeleted: f.isDeleted || false,
      deletedAt: f.deletedAt || null,
      hasContent: true,
      url: f.url || `/api/files/${f.id}/stream`,
      downloadUrl: `/api/files/${f.id}/download`,
      streamUrl: `/api/files/${f.id}/stream`
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

// @route   GET /api/files/:id/stream
// @desc    Stream file directly from MongoDB GridFS chunks with HTTP inline headers (for browser previews, video, audio, PDFs)
// @access  Public
router.get('/:id/stream', async (req, res) => {
  try {
    const fileId = req.params.id;

    if (isDbConnected()) {
      try {
        let fileDoc = null;
        let gridFsObjectId = null;

        if (mongoose.Types.ObjectId.isValid(fileId)) {
          fileDoc = await FileModel.findById(fileId).lean();
          if (fileDoc && fileDoc.gridFsId) {
            gridFsObjectId = new mongoose.Types.ObjectId(fileDoc.gridFsId);
          } else {
            // Check if fileId itself is a direct GridFS ObjectId
            gridFsObjectId = new mongoose.Types.ObjectId(fileId);
          }
        }

        if (gridFsObjectId) {
          const bucket = getGridFSBucket();
          if (bucket) {
            const filesCollection = mongoose.connection.db.collection('uploads.files');
            const gridFile = await filesCollection.findOne({ _id: gridFsObjectId });

            if (gridFile) {
              const mimeType = (fileDoc && fileDoc.mimeType) || gridFile.contentType || getMimeType(gridFile.filename);
              const fileSize = (fileDoc && fileDoc.fileSizeBytes) || gridFile.length;
              const filename = (fileDoc && fileDoc.name) || gridFile.filename;

              res.set('Content-Type', mimeType);
              res.set('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
              res.set('Content-Length', fileSize);
              res.set('Accept-Ranges', 'bytes');

              const downloadStream = bucket.openDownloadStream(gridFsObjectId);
              return downloadStream.pipe(res);
            }
          }
        }
      } catch (dbErr) {
        console.warn('⚡ [GridFS Stream Error]:', dbErr.message);
      }
    }

    // In-memory fallback
    const memFile = inMemoryFiles.find((f) => f.id === fileId);
    if (memFile && memFile.buffer) {
      res.set('Content-Type', memFile.mimeType || 'application/octet-stream');
      res.set('Content-Disposition', `inline; filename="${encodeURIComponent(memFile.name)}"`);
      return res.send(memFile.buffer);
    }

    return res.status(404).send('File not found in GridFS vault');
  } catch (error) {
    console.error('Stream File Error:', error);
    return res.status(500).send('Server error streaming file');
  }
});

// @route   GET /api/files/:id/download
// @desc    Download file directly from MongoDB GridFS as an attachment
// @access  Public
router.get('/:id/download', async (req, res) => {
  try {
    const fileId = req.params.id;

    if (isDbConnected()) {
      try {
        let fileDoc = null;
        let gridFsObjectId = null;

        if (mongoose.Types.ObjectId.isValid(fileId)) {
          fileDoc = await FileModel.findById(fileId).lean();
          if (fileDoc && fileDoc.gridFsId) {
            gridFsObjectId = new mongoose.Types.ObjectId(fileDoc.gridFsId);
          } else {
            gridFsObjectId = new mongoose.Types.ObjectId(fileId);
          }
        }

        if (gridFsObjectId) {
          const bucket = getGridFSBucket();
          if (bucket) {
            const filesCollection = mongoose.connection.db.collection('uploads.files');
            const gridFile = await filesCollection.findOne({ _id: gridFsObjectId });

            if (gridFile) {
              const mimeType = (fileDoc && fileDoc.mimeType) || gridFile.contentType || 'application/octet-stream';
              const fileSize = (fileDoc && fileDoc.fileSizeBytes) || gridFile.length;
              const filename = (fileDoc && fileDoc.name) || gridFile.filename;

              res.set('Content-Type', mimeType);
              res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
              res.set('Content-Length', fileSize);

              const downloadStream = bucket.openDownloadStream(gridFsObjectId);
              return downloadStream.pipe(res);
            }
          }
        }
      } catch (dbErr) {
        console.warn('⚡ [GridFS Download Error]:', dbErr.message);
      }
    }

    // In-memory fallback
    const memFile = inMemoryFiles.find((f) => f.id === fileId);
    if (memFile && memFile.buffer) {
      res.set('Content-Type', memFile.mimeType || 'application/octet-stream');
      res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(memFile.name)}"`);
      return res.send(memFile.buffer);
    }

    return res.status(404).send('File not found for download');
  } catch (error) {
    console.error('Download File Error:', error);
    return res.status(500).send('Server error downloading file');
  }
});

// @route   GET /api/files/:id/content
// @desc    Backwards-compatible endpoint for lazy payload fetching (returns streaming URLs & metadata)
// @access  Public
router.get('/:id/content', async (req, res) => {
  try {
    const fileId = req.params.id;

    if (isDbConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(fileId)) {
          const fileDoc = await FileModel.findById(fileId).lean();
          if (fileDoc) {
            const streamUrl = `/api/files/${fileDoc._id}/stream`;
            return res.json({
              success: true,
              id: fileDoc._id.toString(),
              gridFsId: fileDoc.gridFsId ? fileDoc.gridFsId.toString() : null,
              name: fileDoc.name,
              size: fileDoc.size,
              type: fileDoc.type,
              mimeType: fileDoc.mimeType || getMimeType(fileDoc.name),
              url: streamUrl,
              downloadUrl: `/api/files/${fileDoc._id}/download`,
              checksum: fileDoc.checksum,
              storageType: fileDoc.storageType
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
      const streamUrl = `/api/files/${memFile.id}/stream`;
      return res.json({
        success: true,
        id: memFile.id,
        name: memFile.name,
        size: memFile.size,
        type: memFile.type,
        mimeType: memFile.mimeType || getMimeType(memFile.name),
        url: streamUrl,
        downloadUrl: `/api/files/${memFile.id}/download`,
        checksum: memFile.checksum,
        storageType: memFile.storageType
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

// @route   PATCH /api/files/:id/favorite
// @desc    Toggle favorite (starred) status of a file
router.patch('/:id/favorite', async (req, res) => {
  try {
    const fileId = req.params.id;
    const { isFavorite } = req.body;

    if (isDbConnected()) {
      if (mongoose.Types.ObjectId.isValid(fileId)) {
        const fileDoc = await FileModel.findById(fileId);
        if (fileDoc) {
          fileDoc.isFavorite = typeof isFavorite === 'boolean' ? isFavorite : !fileDoc.isFavorite;
          fileDoc.updatedAt = new Date();
          await fileDoc.save();

          return res.json({
            success: true,
            message: fileDoc.isFavorite ? 'Added to Favorites' : 'Removed from Favorites',
            isFavorite: fileDoc.isFavorite
          });
        }
      }
    }

    const memFile = inMemoryFiles.find((f) => f.id === fileId);
    if (memFile) {
      memFile.isFavorite = typeof isFavorite === 'boolean' ? isFavorite : !memFile.isFavorite;
      return res.json({
        success: true,
        message: memFile.isFavorite ? 'Added to Favorites' : 'Removed from Favorites',
        isFavorite: memFile.isFavorite
      });
    }

    return res.status(404).json({ success: false, message: 'File not found' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/files/:id/trash
// @desc    Soft delete file (move to Trash) or restore from Trash
router.patch('/:id/trash', async (req, res) => {
  try {
    const fileId = req.params.id;
    const { isDeleted } = req.body;

    if (isDbConnected()) {
      if (mongoose.Types.ObjectId.isValid(fileId)) {
        const fileDoc = await FileModel.findById(fileId);
        if (fileDoc) {
          fileDoc.isDeleted = typeof isDeleted === 'boolean' ? isDeleted : true;
          fileDoc.deletedAt = fileDoc.isDeleted ? new Date() : null;
          fileDoc.updatedAt = new Date();
          await fileDoc.save();

          return res.json({
            success: true,
            message: fileDoc.isDeleted ? 'File moved to Trash' : 'File restored successfully',
            isDeleted: fileDoc.isDeleted
          });
        }
      }
    }

    const memFile = inMemoryFiles.find((f) => f.id === fileId);
    if (memFile) {
      memFile.isDeleted = typeof isDeleted === 'boolean' ? isDeleted : true;
      memFile.deletedAt = memFile.isDeleted ? new Date() : null;
      return res.json({
        success: true,
        message: memFile.isDeleted ? 'File moved to Trash' : 'File restored successfully',
        isDeleted: memFile.isDeleted
      });
    }

    return res.status(404).json({ success: false, message: 'File not found' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/files/:id/share
// @desc    Generate share link for a file
router.post('/:id/share', async (req, res) => {
  try {
    const fileId = req.params.id;
    const shareToken = 'share_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    if (isDbConnected()) {
      if (mongoose.Types.ObjectId.isValid(fileId)) {
        const fileDoc = await FileModel.findById(fileId);
        if (fileDoc) {
          fileDoc.shareToken = shareToken;
          await fileDoc.save();
        }
      }
    }

    return res.json({
      success: true,
      message: 'Share link generated successfully',
      shareUrl: `${req.protocol}://${req.get('host')}/api/files/${fileId}/stream?token=${shareToken}`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/files/:id (or /api/files/:id/permanent)
// @desc    Permanently delete file metadata AND GridFS binary chunks from MongoDB database
router.delete('/:id', async (req, res) => {
  try {
    const fileId = req.params.id;

    if (isDbConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(fileId)) {
          const fileDoc = await FileModel.findById(fileId);

          if (fileDoc) {
            // Delete binary chunks from GridFS bucket if gridFsId exists
            if (fileDoc.gridFsId) {
              const bucket = getGridFSBucket();
              if (bucket) {
                try {
                  await bucket.delete(new mongoose.Types.ObjectId(fileDoc.gridFsId));
                  console.log(`🗑️ [GridFS Bucket] Deleted GridFS file chunks for ID: ${fileDoc.gridFsId}`);
                } catch (gridErr) {
                  console.warn('⚡ GridFS delete warning:', gridErr.message);
                }
              }
            }

            // Delete Metadata record
            await FileModel.findByIdAndDelete(fileId);

            return res.json({
              success: true,
              message: 'File permanently deleted.'
            });
          }
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
      message: 'File permanently removed.'
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
