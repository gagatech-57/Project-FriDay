const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware for authentication parsing
const { authMiddleware } = require('./middleware/authMiddleware');
app.use(authMiddleware);

// Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const mobileFileRoutes = require('./routes/mobileFiles');
const userRoutes = require('./routes/user');

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes); // Legacy files endpoint (website compatible)
app.use('/api/mobile/files', mobileFileRoutes); // Secure mobile files endpoint
app.use('/api/user', userRoutes);

// Health check / API status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Project Friday API',
    dbConnected: mongoose.connection.readyState === 1
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/project_friday';

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('⚡ [PROJECT FRIDAY] Connected to local MongoDB successfully at:', MONGO_URI);
    app.listen(PORT, () => {
      console.log(`🚀 [PROJECT FRIDAY] Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ [PROJECT FRIDAY] MongoDB Connection Error:', err.message);
    console.log('⚠️ Running server without DB initial connection. Requests will attempt fallback handle.');
    app.listen(PORT, () => {
      console.log(`🚀 [PROJECT FRIDAY] Server running on http://localhost:${PORT} (Database pending)`);
    });
  });
