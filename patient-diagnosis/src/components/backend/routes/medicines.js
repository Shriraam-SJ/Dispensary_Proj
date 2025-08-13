// routes/medicines.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/medicines ➝ fetch all medicines with name and stock
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, stock FROM medicines ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching medicines:', err);
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
});

export default router;
