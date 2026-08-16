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
  storageType: {
    type: String,
    enum: ['inline', 'gridfs', 'metadata_vault'],
    default: 'metadata_vault'
  },
  url: {
    type: String // Base64 Data URL or Blob URL (loaded lazily on preview/download)
  },
  content: {
    type: String // Text payload (loaded lazily)
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

