const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  size: {
    type: String,
    required: true
  },
  fileSizeBytes: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    required: true
  },
  date: {
    type: String,
    default: () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  },
  checksum: {
    type: String,
    default: null
  },
  mimeType: {
    type: String,
    default: 'application/octet-stream'
  },
  gridFsId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    default: null
  },
  storageType: {
    type: String,
    enum: ['gridfs', 'inline', 'metadata_vault'],
    default: 'gridfs'
  },
  url: {
    type: String // Optional fallback or streaming route URL
  },
  content: {
    type: String // Optional text preview fallback
  },
  userEmail: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for fast queries by user and date
fileSchema.index({ userEmail: 1, createdAt: -1 });

module.exports = mongoose.model('File', fileSchema);

