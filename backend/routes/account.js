const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get complete account overview (user + pets + orders)
router.get('/overview', authenticate, async (req, res) => {
  try {
    // Get user (include email_verified)
    const [users] = await pool.execute(
      'SELECT id, email, name, role, created_at, COALESCE(email_verified, 0) as email_verified FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = users[0];
    // Convert email_verified to boolean (MySQL returns 0/1)
    user.email_verified = user.email_verified === 1 || user.email_verified === true;

    // Get all pets
    const [pets] = await pool.execute(
      'SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // Get all orders with items
    const [orders] = await pool.execute(
      `SELECT o.*, p.name as pet_name, p.type as pet_type
       FROM orders o
       LEFT JOIN pets p ON o.pet_id = p.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    // Get order items for each order
    for (let order of orders) {
      const [items] = await pool.execute(
        `SELECT oi.*, pr.name as product_name, pr.sku, pr.description
         FROM order_items oi
         LEFT JOIN products pr ON oi.product_id = pr.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      
      // Process items to handle subscription metadata
      order.items = items.map(item => {
        // If product_id is null (subscription item), extract data from meta
        if (!item.product_id && item.meta) {
          try {
            const meta = typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta;
            if (meta && meta.type === 'subscription') {
              return {
                ...item,
                product_name: meta.product_name || 'Subscription',
                sku: meta.sku || 'SUB',
                description: meta.description || `${meta.plan_type || 'Subscription'} for ${meta.pet_name || 'pet'}`
              };
            }
          } catch (e) {
            // If meta parsing fails, continue with original item
          }
        }
        return item;
      });
    }

    // Group orders by pet
    const ordersByPet = {};
    orders.forEach(order => {
      const petId = order.pet_id || 'none';
      if (!ordersByPet[petId]) {
        ordersByPet[petId] = [];
      }
      ordersByPet[petId].push(order);
    });

    res.json({
      user,
      pets,
      orders,
      ordersByPet
    });
  } catch (error) {
    console.error('Get account overview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user questionnaire
router.get('/questionnaire', authenticate, async (req, res) => {
  try {
    // Check if questionnaire column exists
    let [rows] = await pool.execute(
      'SELECT questionnaire FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If questionnaire column doesn't exist, return null (graceful degradation)
    if (!rows[0].hasOwnProperty('questionnaire')) {
      console.log('⚠️ Questionnaire column does not exist in users table');
      return res.json({ questionnaire: null });
    }

    const questionnaire = rows[0].questionnaire;
    
    if (!questionnaire) {
      return res.json({ questionnaire: null });
    }

    // Parse JSON if it's a string
    let parsed;
    try {
      parsed = typeof questionnaire === 'string' 
        ? JSON.parse(questionnaire) 
        : questionnaire;
    } catch (parseError) {
      console.error('Error parsing questionnaire JSON:', parseError);
      // If JSON is invalid, return null instead of error
      return res.json({ questionnaire: null });
    }

    res.json({ questionnaire: parsed });
  } catch (error) {
    // Check if error is due to missing column
    if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('questionnaire')) {
      console.warn('⚠️ Questionnaire column does not exist in users table');
      return res.json({ questionnaire: null });
    }
    
    console.error('Get questionnaire error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Create or update user questionnaire
router.put('/questionnaire', authenticate, async (req, res) => {
  try {
    const {
      pet_type,
      pet_name,
      breed,
      custom_breed,
      size,
      brachycephalic,
      activity,
      age_group,
      weight_value,
      weight_unit,
      ideal_weight_value,
      neutered,
      allergies,
      phone,
      email,
      recommendation,
      recommendation_data
    } = req.body;

    // Validate required fields
    if (!pet_type || !pet_name || !activity || !age_group) {
      return res.status(400).json({ 
        error: 'Missing required fields: pet_type, pet_name, activity, age_group' 
      });
    }

    // Prepare questionnaire data
    const questionnaireData = {
      pet_type,
      pet_name,
      breed: breed || null,
      custom_breed: custom_breed || null,
      size: size || null,
      brachycephalic: brachycephalic || false,
      activity,
      age_group,
      weight_value: weight_value || null,
      weight_unit: weight_unit || 'kg',
      ideal_weight_value: ideal_weight_value || null,
      neutered: neutered || null,
      allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
      phone: phone || null,
      email: email || null,
      recommendation: recommendation || null,
      recommendation_data: recommendation_data || null,
      updated_at: new Date().toISOString()
    };

    // Check if questionnaire already exists
    const [existing] = await pool.execute(
      'SELECT questionnaire FROM users WHERE id = ?',
      [req.user.id]
    );

    if (existing.length > 0 && existing[0].questionnaire) {
      // Update existing
      await pool.execute(
        'UPDATE users SET questionnaire = ? WHERE id = ?',
        [JSON.stringify(questionnaireData), req.user.id]
      );
      res.json({ 
        message: 'Questionnaire updated successfully',
        questionnaire: questionnaireData
      });
    } else {
      // Create new
      await pool.execute(
        'UPDATE users SET questionnaire = ? WHERE id = ?',
        [JSON.stringify(questionnaireData), req.user.id]
      );
      res.status(201).json({ 
        message: 'Questionnaire saved successfully',
        questionnaire: questionnaireData
      });
    }
  } catch (error) {
    console.error('Save questionnaire error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create questionnaire (POST - alias for PUT)
router.post('/questionnaire', authenticate, async (req, res) => {
  // Reuse PUT logic
  try {
    const {
      pet_type,
      pet_name,
      breed,
      custom_breed,
      size,
      brachycephalic,
      activity,
      age_group,
      weight_value,
      weight_unit,
      ideal_weight_value,
      neutered,
      allergies,
      phone,
      email,
      recommendation,
      recommendation_data
    } = req.body;

    // Validate required fields
    if (!pet_type || !pet_name || !activity || !age_group) {
      return res.status(400).json({ 
        error: 'Missing required fields: pet_type, pet_name, activity, age_group' 
      });
    }

    // Prepare questionnaire data
    const questionnaireData = {
      pet_type,
      pet_name,
      breed: breed || null,
      custom_breed: custom_breed || null,
      size: size || null,
      brachycephalic: brachycephalic || false,
      activity,
      age_group,
      weight_value: weight_value || null,
      weight_unit: weight_unit || 'kg',
      ideal_weight_value: ideal_weight_value || null,
      neutered: neutered || null,
      allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
      phone: phone || null,
      email: email || null,
      recommendation: recommendation || null,
      recommendation_data: recommendation_data || null,
      updated_at: new Date().toISOString()
    };

    // Try to add questionnaire column if it doesn't exist
    try {
      await pool.execute('ALTER TABLE users ADD COLUMN questionnaire JSON NULL');
      console.log('✅ Added questionnaire column to users table');
    } catch (alterError) {
      // Column might already exist, which is fine
      if (alterError.code !== 'ER_DUP_FIELDNAME') {
        console.warn('⚠️ Could not add questionnaire column:', alterError.message);
      }
    }

    // Check if questionnaire already exists
    const [existing] = await pool.execute(
      'SELECT questionnaire FROM users WHERE id = ?',
      [req.user.id]
    );

    if (existing.length > 0) {
      // Update (whether questionnaire exists or not)
      await pool.execute(
        'UPDATE users SET questionnaire = ? WHERE id = ?',
        [JSON.stringify(questionnaireData), req.user.id]
      );
      
      const isNew = !existing[0].questionnaire;
      res.status(isNew ? 201 : 200).json({ 
        message: isNew ? 'Questionnaire saved successfully' : 'Questionnaire updated successfully',
        questionnaire: questionnaireData
      });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Save questionnaire error:', error);
    // Check if error is due to missing column
    if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('questionnaire')) {
      return res.status(500).json({ 
        error: 'Questionnaire feature not available. Please contact support.',
        details: 'Database column missing'
      });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;

