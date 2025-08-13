import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { patientRegNo, patientProblems, patientDiagnosis, medicines } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch patient details
    const patientRes = await client.query(
      'SELECT gender, type FROM patients WHERE regno = $1',
      [patientRegNo]
    );
    if (patientRes.rows.length === 0) {
      throw new Error('Patient not found');
    }
    const { gender, type } = patientRes.rows[0];
    const columnMap = {
      'Male-Student': 'male_student',
      'Female-Student': 'female_student',
      'Male-Staff': 'male_staff',
      'Female-Staff': 'female_staff'
    };
    const key = `${gender}-${type}`;
    const columnToUpdate = columnMap[key];
    if (!columnToUpdate) {
      throw new Error(`Invalid gender/type: ${gender} ${type}`);
    }

    // 2. Insert visit (diagnosis)
    const visitRes = await client.query(
      'INSERT INTO visits (patient_regno, visit_date, problems, diagnosis) VALUES ($1, CURRENT_DATE, $2, $3) RETURNING id',
      [patientRegNo, patientProblems, patientDiagnosis]
    );
    const visitId = visitRes.rows[0].id;

    // 3. Update daily_summary
    const todayDate = new Date().toISOString().split('T')[0];
    const summaryRes = await client.query(
      'SELECT * FROM daily_summary WHERE date = $1',
      [todayDate]
    );
    let diagnosedToday = [];
    if (summaryRes.rows.length === 0) {
      await client.query(
        `INSERT INTO daily_summary (date, ${columnToUpdate}, total_entries, regnos)
         VALUES ($1, 1, 1, ARRAY[$2])`,
        [todayDate, patientRegNo]
      );
    } else {
      diagnosedToday = summaryRes.rows[0].regnos || [];
      if (diagnosedToday.includes(patientRegNo)) {
        throw new Error('Patient already diagnosed today.');
      }
      await client.query(
        `UPDATE daily_summary SET 
           ${columnToUpdate} = COALESCE(${columnToUpdate}, 0) + 1,
           total_entries = COALESCE(total_entries, 0) + 1,
           regnos = array_append(regnos, $1)
         WHERE date = $2`,
        [patientRegNo, todayDate]
      );
    }

    // 4. Prescribed medicines, stock updates, daily stock report
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    for (const med of medicines || []) {
      const { name, quantity, instructions } = med;

      // Insert prescribed_med
      await client.query(
        'INSERT INTO prescribed_med (visit_id, medicine_name, quantity, instructions) VALUES ($1, $2, $3, $4)',
        [visitId, name, quantity, instructions]
      );

      // Get current stock
      const medRes = await client.query('SELECT stock FROM medicines WHERE name = $1', [name]);
      if (medRes.rows.length === 0) {
        throw new Error(`Medicine "${name}" not found in stock.`);
      }
      const currentStock = medRes.rows[0].stock;
      const newStock = currentStock - quantity;

      // Update medicines table stock
      await client.query(
        'UPDATE medicines SET stock = $1, last_updated = CURRENT_DATE WHERE name = $2',
        [newStock, name]
      );

      // Daily stock report entry
      const stockReportRes = await client.query(
        'SELECT * FROM daily_stock_report WHERE medicine_name = $1 AND report_date = $2',
        [name, todayDate]
      );
      if (stockReportRes.rows.length === 0) {
        // Try to get opening from yesterday
        const prevRes = await client.query(
          'SELECT closing_stock FROM daily_stock_report WHERE medicine_name = $1 AND report_date = $2',
          [name, yesterday]
        );
        const openingStock = prevRes.rowCount > 0 ? prevRes.rows[0].closing_stock : currentStock;
        await client.query(
          'INSERT INTO daily_stock_report (medicine_name, report_date, opening_stock, closing_stock) VALUES ($1, $2, $3, $4)',
          [name, todayDate, openingStock, newStock]
        );
      } else {
        // Update closing stock of today
        await client.query(
          'UPDATE daily_stock_report SET closing_stock = closing_stock - $1 WHERE medicine_name = $2 AND report_date = $3',
          [quantity, name, todayDate]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Diagnosis update failed:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});
export default router;
