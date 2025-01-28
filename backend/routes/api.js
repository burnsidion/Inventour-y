import express from 'express';
import pool from '../utils/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

//Users Routes
router.post('/users', async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      const result = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
        [name, email, hashedPassword]
      );
  
      res.status(201).json({ message: 'User created!', user: result.rows[0] });
    } catch (err) {
      console.error('Error creating user:', err);
      res.status(500).json({ error: 'Failed to create user' });
    }
});

router.put('/users', authenticateToken, async (req, res) => {
  const { name, email, password } = req.body;
  const userId = req.user.id;

  try {
    let hashedPassword = null;
    if (password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email), 
           password = COALESCE($3, password) 
       WHERE id = $4 RETURNING id, name, email`,
      [name, email, hashedPassword, userId]
    );

    res.status(200).json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.post('/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET,         
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
    });
  } catch (error) {
    console.error('Error logging in:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

//Tour Routes
router.post('/tours', authenticateToken, async (req, res) => {
  const { user_id, name, start_date, end_date, band_name } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO tours (user_id, name, start_date, end_date, band_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, name, start_date, end_date, band_name]
    );
    res.status(201).json(result.rows[0]);
  } catch(error) {
    console.error('Error creating tour', error);
    res.status(500).json({ error: 'Internal service error' });
  }
});

router.get('/tours', authenticateToken, async (req, res) => {
  const { user_id } = req.query;

  try {
    const result = await pool.query(
      'SELECT * FROM tours WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );

    if(result.rows.length === 0) {
      return res.status(404).json({ message: 'No tours found for this user.' });
    }

    res.status(200).json(result.rows);
  } catch(error) {
    console.error('Error fetching tours', error);
    res.status(500).json({message: 'Failed to fetch tours' });
  }
});

//Show Routes
router.post('/shows', authenticateToken, async (req, res) => {
  const { tour_id, date, venue, city, state } = req.body;

  if (!tour_id || !date || !venue || !city || !state) {
    return res.status(400).json({ error: 'Missing required fields: tour_id, date, venue, city, state' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO shows (tour_id, date, venue, city, state) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [tour_id, date, venue, city, state]
    );

    res.status(201).json({ message: 'Show created!', show: result.rows[0] });
  } catch(error) {
    console.error('Error creating show', error);
    res.status(500).json({ error: 'Failed to create show' });
  }
});

router.get('/shows', authenticateToken, async (req, res) => {
  const { tour_id } = req.query; 

  if (!tour_id || isNaN(Number(tour_id))) {
    return res.status(400).json({ error: 'Invalid or missing tour_id query parameter' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM shows WHERE tour_id = $1 ORDER BY date ASC',
      [Number(tour_id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No shows found for this tour' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching shows:', error);
    res.status(500).json({ error: 'Failed to fetch shows' });
  }
});

//Inventory routes 
router.post('/inventory', authenticateToken, async (req, res) => {
 const { tour_id, name, type, size, quantity, price, image_url } = req.body;

 if(!tour_id || !name || !type || !quantity || !price) {
  return res.status(400).json({ error: 'Missing required fields: tour_id, name, type, quantity, price' });
 }

 try {
  const result = await pool.query(
    `INSERT INTO inventory (tour_id, name, type, size, quantity, price, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tour_id, name, type, size || null, quantity, price, image_url || null]
  );
  res.status(201).json({ message: 'Inventory items added', itme: result.rows[0] });
 } catch(error) {
  console.error('Error adding inventory', error);
  res.status(500).json({ error: 'Failed to add inventory item' });
 }
});

router.get('/inventory', authenticateToken, async (req, res) => {
  const { tour_id } = req.query;

  if (!tour_id) {
    return res.status(400).json({ error: 'Missing required query parameter: tour_id' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM inventory WHERE tour_id = $1 ORDER BY name ASC',
      [tour_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No inventory items found for this tour' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

//Sales routes 
router.post('/sales', authenticateToken, async (req, res) => {
  const { inventory_id, quantity_sold, total_amount, payment_method } = req.body;

  if (!inventory_id || !quantity_sold || !total_amount || !payment_method) {
    return res.status(400).json({
      error: 'Missing required fields: inventory_id, quantity_sold, total_amount, payment_method',
    });
  }

  const validPaymentMethods = ['cash', 'card', 'free'];

  if (!validPaymentMethods.includes(payment_method)) {
    return res.status(400).json({
      error: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`,
    });
  }

  try {
    await pool.query('BEGIN');

    let adjustedPrice = total_amount;

    if (payment_method === 'free') {
      adjustedPrice = 0;
    }

    const inventoryResult = await pool.query(
      `UPDATE inventory
       SET quantity = quantity - $1
       WHERE id = $2 AND quantity >= $1
       RETURNING *`,
      [quantity_sold, inventory_id]
    );

    if (inventoryResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient inventory or invalid inventory ID' });
    }

    const salesResult = await pool.query(
      `INSERT INTO sales (inventory_id, quantity_sold, total_amount, payment_method)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [inventory_id, quantity_sold, adjustedPrice, payment_method]
    );

    await pool.query('COMMIT');

    res.status(201).json({
      message: 'Sale recorded successfully!',
      sale: salesResult.rows[0],
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error recording sale:', error);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

router.get('/sales', authenticateToken, async (req, res) => {
  const { tour_id } = req.query;

  if (!tour_id) {
    return res.status(400).json({ error: 'Missing required query parameter: tour_id' });
  }

  try {
    const result = await pool.query(
      `SELECT sales.id, sales.quantity_sold, sales.total_amount, sales.payment_method, sales.created_at,
              inventory.name AS item_name, inventory.type, inventory.size, inventory.price
       FROM sales
       JOIN inventory ON sales.inventory_id = inventory.id
       WHERE inventory.tour_id = $1
       ORDER BY sales.created_at DESC`,
      [tour_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No sales found for this tour' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});
export default router;