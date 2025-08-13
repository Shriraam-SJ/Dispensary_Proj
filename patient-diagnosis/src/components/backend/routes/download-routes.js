import express from 'express';
import pool from '../db.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = express.Router();

router.get('/download-report', async (req, res) => {
  const { from, to, format } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: "From and To dates required." });
  }

  const query = `
    SELECT
      b.bill_no,
      b.bill_date,
      bp.medicine_name,
      bp.quantity,
      bp.price_per_unit,
      (bp.quantity * bp.price_per_unit) AS total_cost,
      b.grand_total
    FROM bills b
    JOIN bill_particulars bp ON b.bill_no = bp.bill_no
    WHERE b.bill_date BETWEEN $1 AND $2
    ORDER BY b.bill_date, b.bill_no;
  `;

  try {
    const result = await pool.query(query, [from, to]);
    const rows = result.rows;

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Purchase Report");

      sheet.addRow([
        "Bill No", "Bill Date", "Medicine", "Qty", "₹/Unit", "Total Cost", "Grand Total"
      ]);

      rows.forEach(r => {
        sheet.addRow([
          r.bill_no,
          r.bill_date,
          r.medicine_name,
          r.quantity,
          r.price_per_unit,
          r.total_cost,
          r.grand_total
        ]);
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=purchase_report_${from}_to_${to}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=purchase_report_${from}_to_${to}.pdf`);
      doc.pipe(res);

      doc.fontSize(16).text('Purchase Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`From: ${from} To: ${to}`);
      doc.moveDown();

      doc.text("Bill No | Bill Date | Medicine | Qty | ₹/Unit | Total ₹ | Grand Total");
      doc.moveDown(0.3);

      rows.forEach(row => {
        doc.text(`${row.bill_no} | ${row.bill_date} | ${row.medicine_name} | ${row.quantity} | ${row.price_per_unit} | ${row.total_cost} | ${row.grand_total}`);
      });

      doc.end();
    } else {
      // Default JSON for frontend tables
      res.json(rows);
    }
  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({ error: "Failed to generate report." });
  }
});

export default router;
