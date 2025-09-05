// routes/medicines.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/medicines - fetch all medicines
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, stock, price_per_unit, last_updated FROM medicines ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching medicines:', err);
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
});

// POST /api/medicines/add - add new medicine
router.post('/add', async (req, res) => {
  const { name, stock, price_per_unit } = req.body;
  
  try {
    // Check if medicine already exists
    const existingMed = await pool.query(
      'SELECT id FROM medicines WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    
    if (existingMed.rows.length > 0) {
      return res.status(409).json({ error: 'Medicine already exists' });
    }
    
    const result = await pool.query(
      'INSERT INTO medicines (name, stock, price_per_unit, last_updated) VALUES ($1, $2, $3, CURRENT_DATE) RETURNING *',
      [name, stock, price_per_unit || null]
    );
    
    res.json({ success: true, medicine: result.rows[0] });
  } catch (err) {
    console.error('Error adding medicine:', err);
    res.status(500).json({ error: 'Failed to add medicine' });
  }
});

// PUT /api/medicines/update/:id - update medicine
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { name, stock, price_per_unit } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE medicines SET name = $1, stock = $2, price_per_unit = $3, last_updated = CURRENT_DATE WHERE id = $4 RETURNING *',
      [name, stock, price_per_unit || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    
    res.json({ success: true, medicine: result.rows[0] });
  } catch (err) {
    console.error('Error updating medicine:', err);
    res.status(500).json({ error: 'Failed to update medicine' });
  }
});

// DELETE /api/medicines/remove/:id - remove medicine
// DELETE /api/medicines/remove/:id - remove medicine with FK handling
router.delete('/remove/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get medicine name for constraint checking
    const medicineResult = await client.query(
      'SELECT name FROM medicines WHERE id = $1',
      [id]
    );
    
    if (medicineResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Medicine not found' });
    }
    
    const medicineName = medicineResult.rows.name;
    
    // Check if medicine is referenced in bill_particulars
    const billParticularCheck = await client.query(
      'SELECT COUNT(*) FROM bill_particulars WHERE medicine_name = $1',
      [medicineName]
    );
    
    // Check if medicine is referenced in purchase_bill_items
    const purchaseBillCheck = await client.query(
      'SELECT COUNT(*) FROM purchase_bill_items WHERE medicine_id = $1',
      [id]
    );
    
    // Check if medicine is referenced in prescribed_med (if exists)
    const prescribedMedCheck = await client.query(`
      SELECT COUNT(*) 
      FROM information_schema.tables 
      WHERE table_name = 'prescribed_med'
    `);
    
    let prescribedCount = 0;
    if (prescribedMedCheck.rows.count > 0) {
      const prescribedResult = await client.query(
        'SELECT COUNT(*) FROM prescribed_med WHERE medicine_name = $1',
        [medicineName]
      );
      prescribedCount = parseInt(prescribedResult.rows.count);
    }
    
    const billParticularsCount = parseInt(billParticularCheck.rows.count);
    const purchaseBillCount = parseInt(purchaseBillCheck.rows.count);
    
    if (billParticularsCount > 0 || purchaseBillCount > 0 || prescribedCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: `Cannot delete medicine "${medicineName}". It is referenced in:${
          billParticularsCount > 0 ? `\n- ${billParticularsCount} bill entries` : ''
        }${
          purchaseBillCount > 0 ? `\n- ${purchaseBillCount} purchase records` : ''
        }${
          prescribedCount > 0 ? `\n- ${prescribedCount} prescription records` : ''
        }\n\nPlease remove these references first or contact administrator.`
      });
    }
    
    // If no references, safe to delete
    const result = await client.query(
      'DELETE FROM medicines WHERE id = $1 RETURNING *',
      [id]
    );
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Medicine removed successfully' });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error removing medicine:', err);
    res.status(500).json({ error: 'Failed to remove medicine' });
  } finally {
    client.release();
  }
});


export default router;
