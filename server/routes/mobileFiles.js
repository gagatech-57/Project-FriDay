const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const FileModel = require('../models/File');
const { requireAuth } = require('../middleware/authMiddleware');

// Ensure temporary uploads directory exists
const tempUploadsDir = path.join(__dirname, '../uploads_temp');
if (!fs.existsSync(tempUploadsDir)) {
  fs.mkdirSync(tempUploadsDir, { recursive: true });
}

// Multer disk storage config (avoids keeping files in RAM)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB max size
});

// GridFS Bucket Manager
let gridfsBucket = null;
function getGridFSBucket() {
  if (!gridfsBucket && mongoose.connection.readyState === 1) {
    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
  }
  return gridfsBucket;
}

// Sanitize filename & protect against path traversal
function sanitizeFilename(filename) {
  if (!filename) return 'unnamed_file';
  // Remove directories, path traversals (../ or ..\), and keep only alphanumeric/dots/dashes
  let sanitized = path.basename(filename);
  sanitized = sanitized.replace(/[\/\\]/g, '_');
  sanitized = sanitized.replace(/\.\.+/g, '.');
  return sanitized;
}

// Map file details to Categories
function getFileType(filename, mimeType) {
  const ext = filename.split('.').pop().toLowerCase();
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
  if (mimeType.startsWith('video/') || ['mp4', 'webm', 'avi', 'mkv'].includes(ext)) return 'video';
  if (mimeType === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2'].includes(ext)) return 'zip';
  if (mimeType.startsWith('text/') || ['txt', 'json', 'js', 'jsx', 'html', 'css', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'doc';
  return 'other';
}

// Format human-readable file size
function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Generate checksum
function calculateChecksum(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex').substring(0, 16)));
    stream.on('error', err => reject(err));
  });
}

// Block hazardous executables/scripts
const BLACKLISTED_EXTENSIONS = ['exe', 'bat', 'sh', 'cmd', 'msi', 'vbs', 'scr', 'pif', 'com', 'jar', 'vbe', 'jsse', 'ws', 'wsf'];

// Enforce authentication on all sub-routes
router.use(requireAuth);

// @route   POST /api/mobile/files/upload
// @desc    Upload file using streaming to GridFS with ownership mapping
router.post('/upload', upload.single('file'), async (req, res) => {
  let tempFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required.' });
    }

    tempFilePath = req.file.path;
    const originalName = sanitizeFilename(req.file.originalname);
    const ext = originalName.split('.').pop().toLowerCase();

    // Extension Validation
    if (BLACKLISTED_EXTENSIONS.includes(ext)) {
      fs.unlinkSync(tempFilePath);
      return res.status(400).json({
        success: false,
        message: 'File upload blocked: Executable or script files are not allowed.'
      });
    }

    const mimeType = req.file.mimetype || 'application/octet-stream';
    const fileSizeBytes = req.file.size;
    const sizeStr = formatBytes(fileSizeBytes);
    const typeStr = getFileType(originalName, mimeType);
    
    // Checksum generation from disk file
    const checksum = await calculateChecksum(tempFilePath);

    const bucket = getGridFSBucket();
    if (!bucket) {
      fs.unlinkSync(tempFilePath);
      return res.status(500).json({ success: false, message: 'Database file storage is unavailable.' });
    }

    // Open GridFS upload stream
    const uploadStream = bucket.openUploadStream(originalName, {
      contentType: mimeType,
      metadata: {
        ownerId: req.userId,
        originalName,
        uploadDate: new Date()
      }
    });

    const gridFsId = uploadStream.id;

    // Stream from disk into GridFS
    const readStream = fs.createReadStream(tempFilePath);
    
    await new Promise((resolve, reject) => {
      readStream.pipe(uploadStream)
        .on('error', (err) => {
          // Cleanup GridFS on failure
          bucket.delete(gridFsId).catch(() => {});
          reject(err);
        })
        .on('finish', resolve);
    });

    // Cleanup temp disk file
    fs.unlinkSync(tempFilePath);
    tempFilePath = null;

    // Create Metadata Record
    const fileDoc = await FileModel.create({
      name: originalName,
      size: sizeStr,
      fileSizeBytes: fileSizeBytes,
      type: typeStr,
      mimeType: mimeType,
      gridFsId: gridFsId,
      checksum: checksum,
      storageType: 'gridfs',
      ownerId: req.userId,
      userEmail: req.userEmail,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'File uploaded securely to Friday Vault.',
      file: {
        id: fileDoc._id.toString(),
        gridFsId: gridFsId.toString(),
        name: fileDoc.name,
        size: fileDoc.size,
        fileSizeBytes: fileDoc.fileSizeBytes,
        type: fileDoc.type,
        mimeType: fileDoc.mimeType,
        checksum: fileDoc.checksum,
        createdAt: fileDoc.createdAt
      }
    });

  } catch (error) {
    console.error('File Upload Error:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error uploading file.'
    });
  }
});

// @route   GET /api/mobile/files
// @desc    Get paginated, filtered metadata of files owned by user
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const query = { ownerId: req.userId };

    // Search filter (filename)
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    // Category filter
    if (req.query.type) {
      query.type = req.query.type.toLowerCase();
    }

    // Sort options
    let sortQuery = { createdAt: -1 };
    if (req.query.sortBy) {
      const field = req.query.sortBy; // 'name', 'size', 'date'
      const order = req.query.sortOrder === 'asc' ? 1 : -1;
      if (field === 'name') sortQuery = { name: order };
      else if (field === 'size') sortQuery = { fileSizeBytes: order };
      else if (field === 'date') sortQuery = { createdAt: order };
    }

    const totalFiles = await FileModel.countDocuments(query);
    const files = await FileModel.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedFiles = files.map(f => ({
      id: f._id.toString(),
      gridFsId: f.gridFsId ? f.gridFsId.toString() : null,
      name: f.name,
      size: f.size,
      fileSizeBytes: f.fileSizeBytes || 0,
      type: f.type,
      mimeType: f.mimeType,
      date: f.date,
      checksum: f.checksum,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      owner: f.userEmail
    }));

    return res.json({
      success: true,
      files: formattedFiles,
      pagination: {
        total: totalFiles,
        page,
        limit,
        pages: Math.ceil(totalFiles / limit)
      }
    });

  } catch (error) {
    console.error('Fetch Mobile Files Error:', error);
    return res.status(500).json({ success: false, message: 'Server error listing files.' });
  }
});

// Helper for file ownership checks
async function checkOwnership(fileId, userId) {
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    return { status: 400, message: 'Invalid File ID.' };
  }
  const file = await FileModel.findById(fileId);
  if (!file) {
    return { status: 404, message: 'File not found.' };
  }
  if (!file.ownerId || file.ownerId.toString() !== userId.toString()) {
    return { status: 403, message: 'Access Denied: You do not own this file.' };
  }
  return { file };
}

// @route   GET /api/mobile/files/:id/stream
// @desc    Stream file content for preview (video/image/pdf/text)
router.get('/:id/stream', async (req, res) => {
  try {
    const { status, message, file } = await checkOwnership(req.params.id, req.userId);
    if (status) return res.status(status).json({ success: false, message });

    const bucket = getGridFSBucket();
    if (!bucket || !file.gridFsId) {
      return res.status(500).send('File storage is offline');
    }

    const filesCollection = mongoose.connection.db.collection('uploads.files');
    const gridFile = await filesCollection.findOne({ _id: new mongoose.Types.ObjectId(file.gridFsId) });

    if (!gridFile) {
      return res.status(404).send('GridFS file data not found.');
    }

    res.set('Content-Type', file.mimeType);
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
    res.set('Content-Length', gridFile.length);
    res.set('Accept-Ranges', 'bytes');

    const downloadStream = bucket.openDownloadStream(gridFile._id);
    return downloadStream.pipe(res);

  } catch (error) {
    console.error('Stream Mobile File Error:', error);
    return res.status(500).send('Server error streaming file preview.');
  }
});

// @route   GET /api/mobile/files/:id/download
// @desc    Download file content as attachment
router.get('/:id/download', async (req, res) => {
  try {
    const { status, message, file } = await checkOwnership(req.params.id, req.userId);
    if (status) return res.status(status).json({ success: false, message });

    const bucket = getGridFSBucket();
    if (!bucket || !file.gridFsId) {
      return res.status(500).json({ success: false, message: 'File storage is offline.' });
    }

    const filesCollection = mongoose.connection.db.collection('uploads.files');
    const gridFile = await filesCollection.findOne({ _id: new mongoose.Types.ObjectId(file.gridFsId) });

    if (!gridFile) {
      return res.status(404).json({ success: false, message: 'GridFS file data not found.' });
    }

    res.set('Content-Type', file.mimeType);
    res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.set('Content-Length', gridFile.length);

    const downloadStream = bucket.openDownloadStream(gridFile._id);
    return downloadStream.pipe(res);

  } catch (error) {
    console.error('Download Mobile File Error:', error);
    return res.status(500).json({ success: false, message: 'Server error downloading file.' });
  }
});

// @route   PATCH /api/mobile/files/:id
// @desc    Rename a file
router.patch('/:id', async (req, res) => {
  try {
    const { newName } = req.body;
    if (!newName) {
      return res.status(400).json({ success: false, message: 'New name is required.' });
    }

    const { status, message, file } = await checkOwnership(req.params.id, req.userId);
    if (status) return res.status(status).json({ success: false, message });

    const sanitized = sanitizeFilename(newName);
    
    // Check if new extension is banned
    const ext = sanitized.split('.').pop().toLowerCase();
    if (BLACKLISTED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: 'Rename blocked: Banned executable extension.'
      });
    }

    file.name = sanitized;
    file.updatedAt = new Date();
    await file.save();

    // Note: We can also update filename in GridFS.files, but not strictly required
    // since metadata record name is the source of truth for Project Friday
    const bucket = getGridFSBucket();
    if (bucket && file.gridFsId) {
      try {
        await mongoose.connection.db.collection('uploads.files').updateOne(
          { _id: new mongoose.Types.ObjectId(file.gridFsId) },
          { $set: { filename: sanitized } }
        );
      } catch (err) {
        console.warn('GridFS filename sync warning:', err.message);
      }
    }

    return res.json({
      success: true,
      message: 'File renamed successfully.',
      file: {
        id: file._id.toString(),
        name: file.name,
        updatedAt: file.updatedAt
      }
    });

  } catch (error) {
    console.error('Rename Mobile File Error:', error);
    return res.status(500).json({ success: false, message: 'Server error renaming file.' });
  }
});

// @route   DELETE /api/mobile/files/:id
// @desc    Delete file metadata and GridFS binary chunks
router.delete('/:id', async (req, res) => {
  try {
    const { status, message, file } = await checkOwnership(req.params.id, req.userId);
    if (status) return res.status(status).json({ success: false, message });

    // 1. Delete binary chunks from GridFS bucket
    if (file.gridFsId) {
      const bucket = getGridFSBucket();
      if (bucket) {
        try {
          await bucket.delete(new mongoose.Types.ObjectId(file.gridFsId));
          console.log(`🗑️ [GridFS Bucket] Deleted GridFS chunks for ID: ${file.gridFsId}`);
        } catch (gridErr) {
          console.warn('GridFS chunks delete warning (might already be deleted):', gridErr.message);
        }
      }
    }

    // 2. Delete metadata record
    await FileModel.findByIdAndDelete(file._id);

    return res.json({
      success: true,
      message: 'File deleted from vault.'
    });

  } catch (error) {
    console.error('Delete Mobile File Error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting file.' });
  }
});

module.exports = router;
