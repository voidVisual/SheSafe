const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run, all } = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Register a new user
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const { fullName, phone, email, password, confirmPassword } = req.body;

    if (!fullName || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields (Full Name, Phone, Email, Password) are required.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if email already exists
    const existingUser = await get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await run(
      'INSERT INTO users (name, phone, email, password_hash) VALUES (?, ?, ?, ?)',
      [fullName.trim(), phone.trim(), email.trim().toLowerCase(), passwordHash]
    );

    const userId = result.lastID;

    // Seed default settings for the user
    await run(
      'INSERT OR IGNORE INTO settings (user_id, notifications, dark_mode, sound_alarm, language, auto_share_location) VALUES (?, 1, 0, 1, "en", 1)',
      [userId]
    );

    // Seed default emergency contacts if none exist
    const defaultContacts = [
      { name: 'Mom', phone: '+91 9775800554', relationship: 'Mother', isPrimary: 1 },
      { name: 'Dad', phone: '+91 9475265165', relationship: 'Father', isPrimary: 0 },
      { name: 'Brother', phone: '+91 9748748772', relationship: 'Brother', isPrimary: 0 }
    ];

    for (const c of defaultContacts) {
      await run(
        'INSERT INTO contacts (user_id, name, phone, relationship, is_primary) VALUES (?, ?, ?, ?, ?)',
        [userId, c.name, c.phone, c.relationship, c.isPrimary]
      );
    }

    // Generate JWT
    const token = jwt.sign({ id: userId, email: email.trim().toLowerCase() }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: userId,
        name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Phone and password are required.'
      });
    }

    const cleanInput = emailOrPhone.trim();

    // Query user by email OR phone
    const user = await get(
      'SELECT id, name, phone, email, password_hash, emergency_message FROM users WHERE LOWER(email) = LOWER(?) OR phone = ?',
      [cleanInput, cleanInput]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        emergencyMessage: user.emergency_message
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await get(
      'SELECT id, name, phone, email, emergency_message, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const contactsCount = await get(
      'SELECT COUNT(*) as count FROM contacts WHERE user_id = ?',
      [req.user.id]
    );

    const activeSos = await get(
      'SELECT id, status, triggered_at FROM sos_alerts WHERE user_id = ? AND status = "ACTIVE" ORDER BY triggered_at DESC LIMIT 1',
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        emergencyMessage: user.emergency_message,
        createdAt: user.created_at,
        emergencyContactsCount: contactsCount ? contactsCount.count : 0,
        hasActiveSOS: !!activeSos
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, emergencyMessage } = req.body;

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (phone) {
      updates.push('phone = ?');
      params.push(phone.trim());
    }
    if (emergencyMessage !== undefined) {
      updates.push('emergency_message = ?');
      params.push(emergencyMessage.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update.'
      });
    }

    params.push(req.user.id);
    await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const updatedUser = await get(
      'SELECT id, name, phone, email, emergency_message FROM users WHERE id = ?',
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile
};
