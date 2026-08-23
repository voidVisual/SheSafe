const { get, all, run } = require('../database/db');
const { sendEmergencySMS } = require('../services/smsService');

/**
 * Trigger an SOS emergency alert
 * POST /api/sos/trigger
 */
const triggerSOS = async (req, res, next) => {
  try {
    const { latitude, longitude, address, batteryLevel } = req.body;

    const user = req.user;

    // Fetch user's registered emergency contacts
    const contacts = await all(
      'SELECT id, name, phone, relationship, email FROM contacts WHERE user_id = ?',
      [user.id]
    );

    const lat = latitude ? parseFloat(latitude) : null;
    const lng = longitude ? parseFloat(longitude) : null;
    const mapUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;
    const resolvedAddress = address || (lat && lng ? `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}` : 'Location unknown');

    // Create SOS alert record in DB
    const result = await run(
      `INSERT INTO sos_alerts (user_id, latitude, longitude, address, battery_level, status, notification_status)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', 'DISPATCHED')`,
      [user.id, lat, lng, resolvedAddress, batteryLevel || null]
    );

    const sosId = result.lastID;

    // If location provided, also log into location_logs
    if (lat && lng) {
      await run(
        `INSERT INTO location_logs (user_id, latitude, longitude, address, status)
         VALUES (?, ?, ?, ?, 'EMERGENCY_SOS')`,
        [user.id, lat, lng, resolvedAddress]
      );
    }

    // Format emergency message
    const emergencyMsgText = `🚨 URGENT: EMERGENCY SOS ALERT 🚨\n\n` +
      `${user.name.toUpperCase()} is in DANGER and has triggered an SOS alarm from the SheSafe app. She needs your immediate help.\n\n` +
      `📍 Location: ${resolvedAddress}\n` +
      (mapUrl ? `🗺️ Google Maps: ${mapUrl}\n` : '') +
      (batteryLevel ? `🔋 Phone Battery: ${batteryLevel}%\n` : '') +
      `⏰ Time: ${new Date().toLocaleTimeString()} ${new Date().toLocaleDateString()}`;

    console.log(`\n🚨 ================= [SOS TRIGGERED] ================= 🚨`);
    console.log(`User: ${user.name} (${user.phone})`);
    console.log(`Location: ${resolvedAddress}`);
    console.log(`Map: ${mapUrl}`);
    console.log(`Alerting ${contacts.length} Emergency Contacts:`);

    // Dispatch SMS to all contacts using Twilio Service
    const dispatchResults = await Promise.all(contacts.map(async (c) => {
      console.log(` - 📲 Sending SMS to ${c.name} (${c.phone})...`);
      const smsResult = await sendEmergencySMS(c.phone, emergencyMsgText);
      
      return {
        contactId: c.id,
        name: c.name,
        phone: c.phone,
        relationship: c.relationship,
        status: smsResult.success ? 'SENT' : 'FAILED',
        error: smsResult.error || null,
        simulated: smsResult.simulated || false,
        messageId: smsResult.messageId || null,
        channel: 'SMS',
        dispatchedAt: new Date().toISOString()
      };
    }));

    console.log(`========================================================\n`);

    return res.status(201).json({
      success: true,
      message: '🚨 SOS Emergency Alert Activated! Emergency contacts have been notified.',
      sos: {
        id: sosId,
        status: 'ACTIVE',
        latitude: lat,
        longitude: lng,
        address: resolvedAddress,
        mapUrl,
        batteryLevel,
        triggeredAt: new Date().toISOString(),
        emergencyMessage: emergencyMsgText,
        dispatchedContacts: dispatchResults
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active SOS status
 * GET /api/sos/status
 */
const getActiveSOS = async (req, res, next) => {
  try {
    const activeSos = await get(
      `SELECT * FROM sos_alerts WHERE user_id = ? AND status = 'ACTIVE' ORDER BY triggered_at DESC LIMIT 1`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      isActive: !!activeSos,
      sos: activeSos || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve / Cancel an SOS emergency alert
 * POST /api/sos/resolve
 */
const resolveSOS = async (req, res, next) => {
  try {
    const { sosId, resolutionNote } = req.body;

    let targetId = sosId;
    if (!targetId) {
      const active = await get(
        `SELECT id FROM sos_alerts WHERE user_id = ? AND status = 'ACTIVE' ORDER BY triggered_at DESC LIMIT 1`,
        [req.user.id]
      );
      if (active) targetId = active.id;
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'No active SOS alert found to resolve.'
      });
    }

    await run(
      `UPDATE sos_alerts SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      [targetId, req.user.id]
    );

    // Update location status back to SAFE
    await run(
      `UPDATE location_logs SET status = 'SAFE' WHERE user_id = ? AND id = (SELECT MAX(id) FROM location_logs WHERE user_id = ?)`,
      [req.user.id, req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: '✅ Emergency SOS marked as resolved. Safety status set back to SAFE.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get historical SOS logs
 * GET /api/sos/history
 */
const getSOSHistory = async (req, res, next) => {
  try {
    const history = await all(
      `SELECT * FROM sos_alerts WHERE user_id = ? ORDER BY triggered_at DESC LIMIT 20`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerSOS,
  getActiveSOS,
  resolveSOS,
  getSOSHistory
};
