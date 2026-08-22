const { get, all, run } = require('../database/db');

/**
 * Get all emergency contacts for the authenticated user
 * GET /api/contacts
 */
const getContacts = async (req, res, next) => {
  try {
    const contacts = await all(
      'SELECT id, name, phone, relationship, email, is_primary, created_at FROM contacts WHERE user_id = ? ORDER BY is_primary DESC, id ASC',
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: contacts.length,
      contacts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new emergency contact
 * POST /api/contacts
 */
const addContact = async (req, res, next) => {
  try {
    const { name, phone, relationship, email, isPrimary } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Contact name and phone number are required.'
      });
    }

    // Limit maximum emergency contacts to 10
    const countResult = await get('SELECT COUNT(*) as count FROM contacts WHERE user_id = ?', [req.user.id]);
    if (countResult && countResult.count >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum limit of 10 emergency contacts reached.'
      });
    }

    const isPrimaryVal = isPrimary ? 1 : 0;

    // If marked as primary, reset other contacts
    if (isPrimaryVal === 1) {
      await run('UPDATE contacts SET is_primary = 0 WHERE user_id = ?', [req.user.id]);
    }

    const result = await run(
      'INSERT INTO contacts (user_id, name, phone, relationship, email, is_primary) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        name.trim(),
        phone.trim(),
        (relationship || 'Emergency Contact').trim(),
        email ? email.trim() : null,
        isPrimaryVal
      ]
    );

    const newContact = await get('SELECT * FROM contacts WHERE id = ?', [result.lastID]);

    return res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully!',
      contact: newContact
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an emergency contact
 * PUT /api/contacts/:id
 */
const updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, relationship, email, isPrimary } = req.body;

    // Verify contact belongs to this user
    const existing = await get('SELECT id FROM contacts WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found.'
      });
    }

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
    if (relationship !== undefined) {
      updates.push('relationship = ?');
      params.push(relationship.trim());
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email ? email.trim() : null);
    }
    if (isPrimary !== undefined) {
      const isPrimaryVal = isPrimary ? 1 : 0;
      if (isPrimaryVal === 1) {
        await run('UPDATE contacts SET is_primary = 0 WHERE user_id = ?', [req.user.id]);
      }
      updates.push('is_primary = ?');
      params.push(isPrimaryVal);
    }

    if (updates.length > 0) {
      params.push(id, req.user.id);
      await run(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
    }

    const updated = await get('SELECT * FROM contacts WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Contact updated successfully!',
      contact: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an emergency contact
 * DELETE /api/contacts/:id
 */
const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await get('SELECT id, name FROM contacts WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found.'
      });
    }

    await run('DELETE FROM contacts WHERE id = ? AND user_id = ?', [id, req.user.id]);

    return res.status(200).json({
      success: true,
      message: `Emergency contact "${existing.name}" removed successfully.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  addContact,
  updateContact,
  deleteContact
};
