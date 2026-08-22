const { get, all, run } = require('../database/db');

/**
 * Update user's live location
 * POST /api/location/update
 */
const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, speed, address, status } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude coordinates are required.'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const locationStatus = status || 'SAFE';

    const result = await run(
      `INSERT INTO location_logs (user_id, latitude, longitude, accuracy, speed, address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, lat, lng, accuracy || null, speed || null, address || null, locationStatus]
    );

    const shareUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    return res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      location: {
        id: result.lastID,
        latitude: lat,
        longitude: lng,
        accuracy,
        speed,
        address,
        status: locationStatus,
        shareUrl,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's current live location
 * GET /api/location/current
 */
const getCurrentLocation = async (req, res, next) => {
  try {
    const latest = await get(
      `SELECT * FROM location_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!latest) {
      return res.status(200).json({
        success: true,
        hasLocation: false,
        message: 'No location recorded yet.'
      });
    }

    const shareUrl = `https://www.google.com/maps?q=${latest.latitude},${latest.longitude}`;

    return res.status(200).json({
      success: true,
      hasLocation: true,
      location: {
        ...latest,
        shareUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent tracking breadcrumbs
 * GET /api/location/history
 */
const getLocationHistory = async (req, res, next) => {
  try {
    const logs = await all(
      `SELECT id, latitude, longitude, accuracy, speed, address, status, created_at
       FROM location_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: logs.length,
      history: logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateLocation,
  getCurrentLocation,
  getLocationHistory
};
