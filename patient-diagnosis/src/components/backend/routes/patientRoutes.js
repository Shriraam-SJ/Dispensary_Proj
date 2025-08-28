import express from 'express';
import pool from '../db.js';

const router = express.Router();
// Add this route to your patientRoutes.js
router.get('/all-patients', async (req, res) => {
  try {
    const result = await pool.query('SELECT regno, name FROM patients ORDER BY regno');
    res.status(200).json({ 
      success: true, 
      patients: result.rows 
    });
  } catch (err) {
    console.error('Error fetching all patients:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// ✅ Add New Patient
router.post('/add-patient', async (req, res) => {
  console.log('Received request body:', req.body);
  const {
    regno, name, age, gender, date, type, mobile, department,stayType
  } = req.body;

  try {
    const existing = await pool.query(
      'SELECT * FROM patients WHERE regno = $1',
      [regno]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Patient already exists for this date.' });
    }

    const query = `
      INSERT INTO patients (regno, name, age, gender, date, type, mobile, department,stay_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9)
      RETURNING *`;
    const values = [regno, name, age, gender, date, type, mobile, department,stayType];

    const result = await pool.query(query, values);
    res.status(201).json({ success: true, patient: result.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/search-regnos', async (req, res) => {
  const { query } = req.query;

  try {
    const result = await pool.query(
      'SELECT * FROM patients WHERE regno ILIKE $1 OR name ILIKE $1 LIMIT 10',
      [`%${query}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching regnos:', error);
    res.status(500).json({ error: 'Server error while searching regnos' });
  }
});

// ✅ NEW: Search patients route for live autocomplete
router.get('/search-patients', async (req, res) => {
  const { term } = req.query;
  
  if (!term || term.length < 1) {
    return res.status(400).json({ success: false, message: 'Search term required' });
  }

  try {
    // Search for patients whose registration number contains the search term
    const result = await pool.query(
      'SELECT regno, name FROM patients WHERE regno ILIKE $1 ORDER BY regno LIMIT 10',
      [`%${term}%`]
    );

    res.status(200).json({ 
      success: true, 
      patients: result.rows 
    });
  } catch (err) {
    console.error('Search patients error:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// 🧾 Fetch Basic Patient Info by Regno (name & gender only)
// 🧾 Fetch Full Patient Info by Regno
router.get('/get-patient/:regno', async (req, res) => {
  const { regno } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM patients WHERE regno = $1',
      [regno]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, patient: result.rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'Patient not found' });
    }
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ message: 'Error retrieving patient data' });
  }
});


// ✏️ Update Existing Patient by Regno
router.put('/update-patient/:regno', async (req, res) => {
  const { regno } = req.params;
  const { name, age, gender, date, type, mobile, department,stayType } = req.body;

  try {
    const result = await pool.query(
      `UPDATE patients SET name = $1, age = $2, gender = $3, date = $4, type = $5, mobile = $6, department = $7, stay_type = $8
       WHERE regno = $9 RETURNING *`,
      [name, age, gender, date, type, mobile, department,stayType, regno]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({ success: true, updatedPatient: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
