const assert = require('assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const User = require('../models/User');
const FileModel = require('../models/File');

const PORT = 5001;
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'friday_secret_fallback';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/project_friday';

// Helper to generate test tokens
const generateTestToken = (id, email) => {
  return jwt.sign({ id, email }, TEST_JWT_SECRET, { expiresIn: '1h' });
};

async function runTests() {
  console.log('🧪 Starting Project Friday Authorization Tests...');
  
  // 1. Connect to MongoDB
  await mongoose.connect(MONGO_URI);
  console.log('⚡ Connected to MongoDB for testing.');

  // Clean up any old test accounts if they exist
  await User.deleteMany({ email: /test_user_.*@friday\.test/ });
  await FileModel.deleteMany({ userEmail: /test_user_.*@friday\.test/ });

  // 2. Seed Test Users
  // Passwords and passkeys are hashed using the schema pre-save hook
  const userA = await User.create({
    name: 'User A',
    email: 'test_user_a@friday.test',
    password: 'password123',
    passkey: '1111'
  });
  
  const userB = await User.create({
    name: 'User B',
    email: 'test_user_b@friday.test',
    password: 'password123',
    passkey: '2222'
  });

  console.log(`👤 Seeded User A (ID: ${userA._id}) and User B (ID: ${userB._id})`);

  // Generate tokens
  const tokenA = generateTestToken(userA._id.toString(), userA.email);
  const tokenB = generateTestToken(userB._id.toString(), userB.email);

  // 3. Seed Test Files
  const fileA = await FileModel.create({
    name: 'user_a_secrets.txt',
    size: '15 Bytes',
    fileSizeBytes: 15,
    type: 'doc',
    mimeType: 'text/plain',
    gridFsId: new mongoose.Types.ObjectId(), // Fake GridFS ID for metadata tests
    checksum: 'checksum_a',
    storageType: 'gridfs',
    ownerId: userA._id,
    userEmail: userA.email
  });

  const fileB = await FileModel.create({
    name: 'user_b_secrets.txt',
    size: '15 Bytes',
    fileSizeBytes: 15,
    type: 'doc',
    mimeType: 'text/plain',
    gridFsId: new mongoose.Types.ObjectId(),
    checksum: 'checksum_b',
    storageType: 'gridfs',
    ownerId: userB._id,
    userEmail: userB.email
  });

  console.log(`📁 Seeded File A (ID: ${fileA._id}) owned by A, and File B (ID: ${fileB._id}) owned by B`);

  // 4. Start the server on TEST PORT
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Register middlewares & routes
  const { authMiddleware } = require('../middleware/authMiddleware');
  app.use(authMiddleware);

  const mobileFileRoutes = require('../routes/mobileFiles');
  app.use('/api/mobile/files', mobileFileRoutes);

  const server = app.listen(PORT);
  console.log(`🚀 Test server started on http://localhost:${PORT}`);

  const baseUrl = `http://localhost:${PORT}/api/mobile/files`;

  try {
    // TEST 1: Missing JWT returns 401
    console.log('\n👉 Running Test 1: Accessing mobile API without JWT should return 401...');
    let res = await fetch(baseUrl);
    assert.strictEqual(res.status, 401);
    let data = await res.json();
    assert.strictEqual(data.success, false);
    console.log('✅ Passed Test 1!');

    // TEST 2: Invalid JWT returns 401
    console.log('\n👉 Running Test 2: Accessing mobile API with invalid JWT should return 401...');
    res = await fetch(baseUrl, {
      headers: { 'Authorization': 'Bearer invalid_token_xyz' }
    });
    assert.strictEqual(res.status, 401);
    data = await res.json();
    assert.strictEqual(data.success, false);
    console.log('✅ Passed Test 2!');

    // TEST 3: User A list files only returns User A's files
    console.log('\n👉 Running Test 3: User A listing files should only see File A...');
    res = await fetch(baseUrl, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.files.length, 1);
    assert.strictEqual(data.files[0].name, 'user_a_secrets.txt');
    console.log('✅ Passed Test 3!');

    // TEST 4: User A tries to view User B's file details or stream (Returns 403)
    console.log('\n👉 Running Test 4: User A attempting to preview/stream User B\'s file should return 403...');
    res = await fetch(`${baseUrl}/${fileB._id}/stream`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    // It should fail with 403 Forbidden
    assert.strictEqual(res.status, 403);
    console.log('✅ Passed Test 4!');

    // TEST 5: User A tries to download User B's file (Returns 403)
    console.log('\n👉 Running Test 5: User A attempting to download User B\'s file should return 403...');
    res = await fetch(`${baseUrl}/${fileB._id}/download`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(res.status, 403);
    console.log('✅ Passed Test 5!');

    // TEST 6: User A tries to rename User B's file (Returns 403)
    console.log('\n👉 Running Test 6: User A attempting to rename User B\'s file should return 403...');
    res = await fetch(`${baseUrl}/${fileB._id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newName: 'hacked_name.txt' })
    });
    assert.strictEqual(res.status, 403);
    console.log('✅ Passed Test 6!');

    // TEST 7: User A tries to delete User B's file (Returns 403)
    console.log('\n👉 Running Test 7: User A attempting to delete User B\'s file should return 403...');
    res = await fetch(`${baseUrl}/${fileB._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(res.status, 403);
    console.log('✅ Passed Test 7!');

    // TEST 8: Valid JWT with User A's file ID can rename/delete User A's file
    console.log('\n👉 Running Test 8: User A should be allowed to rename and delete their own file...');
    res = await fetch(`${baseUrl}/${fileA._id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newName: 'renamed_user_a_secrets.txt' })
    });
    assert.strictEqual(res.status, 200);
    let renameData = await res.json();
    assert.strictEqual(renameData.success, true);
    assert.strictEqual(renameData.file.name, 'renamed_user_a_secrets.txt');

    // Delete own file
    res = await fetch(`${baseUrl}/${fileA._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(res.status, 200);
    let deleteData = await res.json();
    assert.strictEqual(deleteData.success, true);
    console.log('✅ Passed Test 8!');

    console.log('\n🎉 ALL AUTHORIZATION TESTS PASSED SUCCESSFULLY!');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exitCode = 1;
  } finally {
    // 5. Clean up seeded data
    console.log('\n🧹 Cleaning up test users and files...');
    await User.deleteMany({ email: /test_user_.*@friday\.test/ });
    await FileModel.deleteMany({ userEmail: /test_user_.*@friday\.test/ });
    
    // 6. Stop Server and Database Connection
    server.close();
    await mongoose.connection.close();
    console.log('🛑 Server stopped and database connection closed.');
  }
}

runTests();
