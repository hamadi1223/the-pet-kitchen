const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all pets for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const [pets] = await pool.execute(
      'SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(pets);
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single pet
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [pets] = await pool.execute(
      'SELECT * FROM pets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (pets.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(pets[0]);
  } catch (error) {
    console.error('Get pet error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create pet
router.post('/', authenticate, [
  body('name').trim().notEmpty(),
  body('type').isIn(['dog', 'cat']),
  body('breed').optional().trim(),
  body('weight_kg').optional().isFloat({ min: 0 }),
  body('age_group').optional().isIn(['puppy', 'kitten', 'adult', 'senior']),
  body('activity_level').optional().isIn(['low', 'normal', 'high']),
  body('goal').optional().isIn(['maintain', 'lose_weight', 'gain_weight']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, breed, weight_kg, age_group, activity_level, goal, notes } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO pets (user_id, name, type, breed, weight_kg, age_group, activity_level, goal, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, type, breed || null, weight_kg || null, age_group || null, activity_level || null, goal || null, notes || null]
    );

    const [pets] = await pool.execute('SELECT * FROM pets WHERE id = ?', [result.insertId]);
    res.status(201).json(pets[0]);
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update pet
router.patch('/:id', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('type').optional().isIn(['dog', 'cat']),
  body('breed').optional().trim(),
  body('weight_kg').optional().isFloat({ min: 0 }),
  body('age_group').optional().isIn(['puppy', 'kitten', 'adult', 'senior']),
  body('activity_level').optional().isIn(['low', 'normal', 'high']),
  body('goal').optional().isIn(['maintain', 'lose_weight', 'gain_weight']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify ownership
    const [pets] = await pool.execute(
      'SELECT id FROM pets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (pets.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    await pool.execute(
      `UPDATE pets SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute('SELECT * FROM pets WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update pet error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete pet
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Verify ownership
    const [pets] = await pool.execute(
      'SELECT id FROM pets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (pets.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    await pool.execute('DELETE FROM pets WHERE id = ?', [req.params.id]);
    res.json({ message: 'Pet deleted successfully' });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

