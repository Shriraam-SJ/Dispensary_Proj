import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/patient/daily-summary?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/daily-summary', async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Both "from" and "to" dates are required.' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        date,
        male_student,
        female_student,
        male_staff,
        female_staff,
        total_entries,
        regnos
      FROM daily_summary
      WHERE date BETWEEN $1 AND $2
      ORDER BY date ASC;
    `, [from, to]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching daily summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
