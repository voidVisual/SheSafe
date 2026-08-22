const { get, run } = require('../database/db');

/**
 * Get user settings
 * GET /api/settings
 */
const getSettings = async (req, res, next) => {
  try {
    let settings = await get('SELECT * FROM settings WHERE user_id = ?', [req.user.id]);

    if (!settings) {
      // Create default settings if not exists
      await run(
        'INSERT INTO settings (user_id, notifications, dark_mode, sound_alarm, language, auto_share_location) VALUES (?, 1, 0, 1, "en", 1)',
        [req.user.id]
      );
      settings = await get('SELECT * FROM settings WHERE user_id = ?', [req.user.id]);
    }

    return res.status(200).json({
      success: true,
      settings: {
        notifications: Boolean(settings.notifications),
        darkMode: Boolean(settings.dark_mode),
        soundAlarm: Boolean(settings.sound_alarm),
        language: settings.language || 'en',
        autoShareLocation: Boolean(settings.auto_share_location),
        updatedAt: settings.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user settings
 * PUT /api/settings
 */
const updateSettings = async (req, res, next) => {
  try {
    const { notifications, darkMode, soundAlarm, language, autoShareLocation } = req.body;

    const current = await get('SELECT * FROM settings WHERE user_id = ?', [req.user.id]);
    if (!current) {
      await run(
        'INSERT INTO settings (user_id, notifications, dark_mode, sound_alarm, language, auto_share_location) VALUES (?, 1, 0, 1, "en", 1)',
        [req.user.id]
      );
    }

    const updates = [];
    const params = [];

    if (notifications !== undefined) {
      updates.push('notifications = ?');
      params.push(notifications ? 1 : 0);
    }
    if (darkMode !== undefined) {
      updates.push('dark_mode = ?');
      params.push(darkMode ? 1 : 0);
    }
    if (soundAlarm !== undefined) {
      updates.push('sound_alarm = ?');
      params.push(soundAlarm ? 1 : 0);
    }
    if (language !== undefined) {
      updates.push('language = ?');
      params.push(language);
    }
    if (autoShareLocation !== undefined) {
      updates.push('auto_share_location = ?');
      params.push(autoShareLocation ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(req.user.id);
      await run(`UPDATE settings SET ${updates.join(', ')} WHERE user_id = ?`, params);
    }

    const updated = await get('SELECT * FROM settings WHERE user_id = ?', [req.user.id]);

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        notifications: Boolean(updated.notifications),
        darkMode: Boolean(updated.dark_mode),
        soundAlarm: Boolean(updated.sound_alarm),
        language: updated.language,
        autoShareLocation: Boolean(updated.auto_share_location),
        updatedAt: updated.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
