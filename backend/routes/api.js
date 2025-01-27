import express from 'express';
import pool from '../utils/database.js';
import bcrypt from 'bcrypt';

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
  
      res.status(200).json({ message: 'Login successful' });
    } catch (error) {
      console.error('Error logging in:', error.message);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

//Tour Routes
router.post('/tours', async (req, res) => {
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

router.get('/tours', async (req, res) => {
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
router.post('/shows', async (req, res) => {
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

router.get('/shows', async (req, res) => {
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

export default router;