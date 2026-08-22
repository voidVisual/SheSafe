require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const { initDB, get, run } = require('./database/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const contactsRoutes = require('./routes/contactsRoutes');
const sosRoutes = require('./routes/sosRoutes');
const locationRoutes = require('./routes/locationRoutes');
const policeRoutes = require('./routes/policeRoutes');
const aiRoutes = require('./routes/aiRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'SheSafe Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/police', policeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);

// Serve static frontend files from workspace root
app.use(express.static(path.join(__dirname)));

// Root fallback to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 & Error Handling
app.use(notFound);
app.use(errorHandler);

// Helper function to seed demo user if DB is fresh
const seedDemoData = async () => {
  try {
    const existing = await get('SELECT id FROM users WHERE email = ?', ['ushashi@shesafe.app']);
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('password123', salt);
      const userRes = await run(
        'INSERT INTO users (name, phone, email, password_hash) VALUES (?, ?, ?, ?)',
        ['Ushashi Mandal', '+91 9876543210', 'ushashi@shesafe.app', hash]
      );
      const userId = userRes.lastID;

      // Seed starter contacts
      await run('INSERT INTO contacts (user_id, name, phone, relationship, is_primary) VALUES (?, ?, ?, ?, 1)', [userId, 'Mom', '+91 9775800554', 'Mother']);
      await run('INSERT INTO contacts (user_id, name, phone, relationship, is_primary) VALUES (?, ?, ?, ?, 0)', [userId, 'Dad', '+91 9475265165', 'Father']);
      await run('INSERT INTO contacts (user_id, name, phone, relationship, is_primary) VALUES (?, ?, ?, ?, 0)', [userId, 'Brother', '+91 9748748772', 'Brother']);

      // Seed settings
      await run('INSERT INTO settings (user_id, notifications, dark_mode, sound_alarm) VALUES (?, 1, 0, 1)', [userId]);

      console.log('✨ Demo user created: ushashi@shesafe.app (password: password123)');
    }
  } catch (err) {
    console.error('Error seeding demo data:', err.message);
  }
};

// Start Server
const startServer = async () => {
  try {
    await initDB();
    await seedDemoData();

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🛡️  SheSafe Backend Server Running!`);
      console.log(`🚀  Local Server:  http://localhost:${PORT}`);
      console.log(`📡  API Endpoint:  http://localhost:${PORT}/api/health`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start SheSafe server:', error);
    process.exit(1);
  }
};

startServer();
