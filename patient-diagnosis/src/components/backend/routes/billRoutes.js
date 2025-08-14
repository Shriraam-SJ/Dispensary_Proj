import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/report', async (req, res) => {
  const { from, to } = req.query;
  try {
    const query = `
      SELECT 
        b.bill_no, b.bill_date,b.grand_total, b.enterprise_name,
        bp.medicine_name, bp.quantity, bp.price_per_unit
      FROM bills b
      JOIN bill_particulars bp ON b.bill_no = bp.bill_no
      WHERE b.bill_date BETWEEN $1 AND $2
      ORDER BY b.bill_no, bp.medicine_name;
    `;

    const result = await pool.query(query, [from, to]);
    res.json(result.rows);
  } catch (err) {
    console.error('Report fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add new purchase bill
router.post('/submit-bill', async (req, res) => {
  const { billInfo, items, grandTotal } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const billDate = billInfo.dateOfPurchase;

    // ---- 1. Prevent duplicate bill numbers in legacy table ----
    const billExists = await client.query(
      `SELECT 1 FROM bills WHERE bill_no = $1`,
      [billInfo.billNumber]
    );
    if (billExists.rowCount > 0) {
      throw new Error(`Bill number ${billInfo.billNumber} already exists.`);
    }

    // ---- 2. Insert into purchase_bills (modern app table) ----
    const purchaseBillRes = await client.query(
      'INSERT INTO purchase_bills (bill_number, purchase_date) VALUES ($1, $2) RETURNING id',
      [billInfo.billNumber, billDate]
    );
    const purchaseBillId = purchaseBillRes.rows[0].id;

    // ---- 3. Insert into bills (legacy/report table) ----
    const billResult = await client.query(
      `INSERT INTO bills (bill_no, bill_date, grand_total, enterprise_name)
      VALUES ($1, $2, $3, $4)
      RETURNING bill_no`,
      [billInfo.billNumber, billDate, grandTotal, billInfo.enterpriseName]
    );

    const billNo = billResult.rows[0].bill_no;

    // ---- 4. Loop through all items ----
    const yesterday = new Date(new Date(billDate).getTime() - 86400000)
      .toISOString()
      .split('T')[0];

    for (const item of items) {
      const medicineName = item.medicineName.trim();

      // --- a) Ensure medicine exists in medicines table; update stock ---
      let medRes = await client.query('SELECT id, stock FROM medicines WHERE name = $1', [medicineName]);
      let medId;
      let currentStock = 0;

      if (medRes.rows.length === 0) {
        const medInsert = await client.query(
          'INSERT INTO medicines (name, stock, price_per_unit) VALUES ($1, $2, $3) RETURNING id, stock',
          [medicineName, item.quantity, item.pricePerUnit]
        );
        medId = medInsert.rows[0].id;
        currentStock = item.quantity;
      } else {
        medId = medRes.rows[0].id;
        currentStock = medRes.rows[0].stock + item.quantity;
        await client.query(
          'UPDATE medicines SET stock = stock + $1, price_per_unit = $2, last_updated = CURRENT_DATE WHERE id = $3',
          [item.quantity, item.pricePerUnit, medId]
        );
      }

      // --- b) Insert into purchase_bill_items (app) ---
      await client.query(
        'INSERT INTO purchase_bill_items (purchase_bill_id, medicine_id, quantity, price_per_unit) VALUES ($1, $2, $3, $4)',
        [purchaseBillId, medId, item.quantity, item.pricePerUnit]
      );

      // --- c) Insert into bill_particulars (legacy/report) ---
      await client.query(
        'INSERT INTO bill_particulars (bill_no, medicine_name, quantity, price_per_unit) VALUES ($1, $2, $3, $4)',
        [billNo, medicineName, item.units, item.pricePerUnit]
      );

      // ---- d) DAILY STOCK REPORT MANAGEMENT ----
      // See if today's record exists for this medicine
      const reportCheck = await client.query(
        `SELECT * FROM daily_stock_report 
         WHERE medicine_name = $1 AND report_date = $2`,
        [medicineName, billDate]
      );

      // Get yesterday's closing stock
      let openingStock = 0;
      if (reportCheck.rowCount === 0) {
        const prev = await client.query(
          `SELECT closing_stock FROM daily_stock_report 
           WHERE medicine_name = $1 AND report_date = $2`,
          [medicineName, yesterday]
        );
        openingStock = prev.rowCount > 0 ? prev.rows[0].closing_stock : 0;

        // Insert today's stock report
        await client.query(
          `INSERT INTO daily_stock_report 
           (medicine_name, report_date, opening_stock, closing_stock)
           VALUES ($1, $2, $3, $4)`,
          [medicineName, billDate, openingStock, openingStock + item.quantity]
        );
      } else {
        // Update today's closing stock
        await client.query(
          `UPDATE daily_stock_report
           SET closing_stock = closing_stock + $1
           WHERE medicine_name = $2 AND report_date = $3`,
          [item.quantity, medicineName, billDate]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Bill saved and all related tables updated.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Bill submit error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
