import express from 'express';
import pool from '../db.js';
const router = express.Router();

// GET /api/report/stock-movement?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/stock-movement', async (req, res) => {
  const { from, to } = req.query;
  try {
    const query = `
      SELECT
        m.id,
        m.name,
        -- Opening stock ON the 'from' date (start of day)
        COALESCE(
          (SELECT SUM(pbi.quantity) 
           FROM purchase_bill_items pbi 
           JOIN purchase_bills pb ON pb.id = pbi.purchase_bill_id 
           WHERE pbi.medicine_id = m.id AND pb.purchase_date <= $1), 0
        ) - COALESCE(
          (SELECT SUM(pm.quantity) 
           FROM prescribed_med pm 
           JOIN visits v ON v.id = pm.visit_id 
           WHERE pm.medicine_name = m.name AND v.visit_date < $1), 0
        ) AS opening_stock,
        
        -- Stock IN during the period (from to to)
        COALESCE(
          (SELECT SUM(pbi.quantity) 
           FROM purchase_bill_items pbi 
           JOIN purchase_bills pb ON pb.id = pbi.purchase_bill_id 
           WHERE pbi.medicine_id = m.id AND pb.purchase_date BETWEEN $1 AND $2), 0
        ) AS stock_in,
        
        -- Stock OUT during the period (from to to)
        COALESCE(
          (SELECT SUM(pm.quantity) 
           FROM prescribed_med pm 
           JOIN visits v ON v.id = pm.visit_id 
           WHERE pm.medicine_name = m.name AND v.visit_date BETWEEN $1 AND $2), 0
        ) AS stock_out,
        
        -- Closing stock as of 'to' date (end of day)
        COALESCE(
          (SELECT SUM(pbi.quantity) 
           FROM purchase_bill_items pbi 
           JOIN purchase_bills pb ON pb.id = pbi.purchase_bill_id 
           WHERE pbi.medicine_id = m.id AND pb.purchase_date <= $2), 0
        ) - COALESCE(
          (SELECT SUM(pm.quantity) 
           FROM prescribed_med pm 
           JOIN visits v ON v.id = pm.visit_id 
           WHERE pm.medicine_name = m.name AND v.visit_date <= $2), 0
        ) AS closing_stock
        
      FROM medicines m
      ORDER BY m.name;
    `;
    
    const result = await pool.query(query, [from, to]);
    res.json(result.rows);
  } catch (err) {
    console.error('Stock movement query error:', err);
    res.status(500).json({ error: err.message });
  }
});


export default router;
