const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  passkey: {
    type: String,
    required: [true, 'Passkey is required'],
    minlength: 4
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to hash password and passkey
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isModified('passkey')) {
    const salt = await bcrypt.genSalt(10);
    this.passkey = await bcrypt.hash(this.passkey, salt);
  }
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to compare passkey
userSchema.methods.matchPasskey = async function (enteredPasskey) {
  return await bcrypt.compare(enteredPasskey, this.passkey);
};

module.exports = mongoose.model('User', userSchema);
