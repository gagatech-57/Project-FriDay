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
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    default: null
  },
  userEmail: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  sharedWith: [
    {
      email: { type: String, lowercase: true, trim: true },
      access: { type: String, enum: ['view', 'download'], default: 'view' },
      sharedAt: { type: Date, default: Date.now }
    }
  ],
  shareToken: {
    type: String,
    default: null,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for fast queries
fileSchema.index({ userEmail: 1, isDeleted: 1, createdAt: -1 });
fileSchema.index({ userEmail: 1, isFavorite: 1, isDeleted: 1 });
fileSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('File', fileSchema);

