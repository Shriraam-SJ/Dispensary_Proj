import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import * as XLSX from 'xlsx';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // ✅ Add framer-motion for slider
import '../styles/Dashboard.css';
import { useLoader } from '../providers/LoaderProvider'; // ✅ Add loader hook
import logo from '../assets/tce-logo.png';
import dayjs from 'dayjs';
import { showReportSuccess } from '../utils/notifications';

const Dashboard = () => {
  const navigate = useNavigate();
  const { withLoader } = useLoader();
  
  // ✅ Add slider state
  const [reportsExpanded, setReportsExpanded] = useState(false);
  
  const [reportDates, setReportDates] = useState({
    purchaseFrom: '',
    purchaseTo: '',
    entryFrom: '',
    entryTo: '',
    stockFrom: '',
    stockTo: ''
  });

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setReportDates(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ Navigation with loader for menu buttons
  const handleNavigation = async (path) => {
    await withLoader(async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate(path);
    });
  };

  // ✅ Toggle reports slider
  const toggleReports = () => {
    setReportsExpanded(!reportsExpanded);
  };

  // Helper functions (keep your existing ones)
  const addPDFHeader = (doc, title, fromDate, toDate) => {
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('TCE Dispensary', 14, 20);
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text(title, 14, 29);
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Report Period: ${dayjs(fromDate).format('DD-MM-YYYY')} to ${dayjs(toDate).format('DD-MM-YYYY')}`, 14, 37);
    return 48;
  };

  const addPDFSignatures = (doc) => {
  const pageHeight = doc.internal.pageSize.height;
  const marginBottom = 45; // space needed for timestamp + signature
  const signatureY = pageHeight - 30;
  
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  
  // Staff signature on the left
  doc.text('Staff Signature', 14, signatureY);
  
  // Manager signature on the right
  const pageWidth = doc.internal.pageSize.width;
  doc.text('Manager', pageWidth - 50, signatureY);
};


  const addFooterToAllPages = (doc, filename) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Generated on: ${dayjs().format('DD-MM-YYYY HH:mm')} | Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 45
      );
    }
  };

  // ✅ Purchase Report with loader
  const generateReport = async (type) => {
  let fromDate, toDate;
  if (type === 'purchase') {
    fromDate = reportDates.purchaseFrom;
    toDate = reportDates.purchaseTo;
  }

  if (!fromDate || !toDate) {
    alert("Please select both FROM and TO dates.");
    return;
  }

  await withLoader(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/bills/report', {
        params: { from: fromDate, to: toDate }
      });
      const data = res.data;

      const grouped = data.reduce((acc, row) => {
        if (!acc[row.bill_no]) acc[row.bill_no] = [];
        acc[row.bill_no].push(row);
        return acc;
      }, {});

      const doc = new jsPDF();
      let startY = addPDFHeader(doc, 'Purchase Bill Report', fromDate, toDate);

      for (const billNo in grouped) {
        const items = grouped[billNo];
        const { bill_date, grand_total, enterprise_name } = items[0];
        const displayDate = dayjs(bill_date).format('DD-MM-YYYY');
        
        doc.setFontSize(12);
        doc.setTextColor(20, 20, 20);
        const billHeader = [
          `Invoice No: ${billNo}`,
          `Date: ${displayDate}`,
          `Enterprise: ${enterprise_name || 'N/A'}`
        ].join(' | ');
        doc.text(billHeader, 14, startY);
        startY += 8;

        doc.autoTable({
          startY: startY,
          head: [[
            { content: 'Medicine Name', styles: { fontStyle: 'bold', halign: 'left' } },
            { content: 'Qty', styles: { fontStyle: 'bold', halign: 'center' } },
            { content: 'Rs./Unit', styles: { fontStyle: 'bold', halign: 'right' } },
            { content: 'Total Rs.', styles: { fontStyle: 'bold', halign: 'right' } },
            { content: 'Remarks/Feedback', styles: { fontStyle: 'bold', halign: 'center' } }
          ]],
          body: items.map(row => [
            { content: row.medicine_name, styles: { halign: 'left' } },
            { content: row.quantity.toString(), styles: { halign: 'center' } },
            { content: parseFloat(row.price_per_unit).toFixed(2), styles: { halign: 'right' } },
            { content: (row.quantity * row.price_per_unit).toFixed(2), styles: { halign: 'right' } },
            { content: '', styles: { halign: 'center' } }
          ]),
          theme: 'grid',
          margin: { left: 14, right: 14, bottom: 60 }, // Bottom margin reserves space for signature
          styles: { font: 'helvetica', fontSize: 10, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.5 },
          headStyles: { fillColor: [70, 130, 180], textColor: 255, fontSize: 10, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 25 }, 2: { cellWidth: 30 }, 3: { cellWidth: 30 }, 4: { cellWidth: 40 } }
        });

        startY = doc.lastAutoTable.finalY + 8;

        doc.setFontSize(12);
        doc.setTextColor(0, 100, 0);
        doc.setFont('helvetica', 'bold');
        if (grand_total !== undefined) {
          doc.text(
            `Grand Total: Rs. ${Number(grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            14,
            startY
          );
        }
        doc.setFont('helvetica', 'normal');
        startY += 15;

        // ✅ Smart page break logic - only add new page if not enough space for next bill + signature
        const pageHeight = doc.internal.pageSize.height;
        const spaceNeededForSignature = 60; // Space for signature area
        const remainingBills = Object.keys(grouped).length - Object.keys(grouped).indexOf(billNo) - 1;
        
        if (remainingBills > 0 && startY + spaceNeededForSignature > pageHeight - 60) {
          doc.addPage();
          startY = 20;
        }
      }

      addFooterToAllPages(doc, `Purchase_Report_${fromDate}_to_${toDate}.pdf`);
      addPDFSignatures(doc);
      doc.save(`Purchase_Report_${fromDate}_to_${toDate}.pdf`);
      showReportSuccess('Purchase');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate PDF report.');
    }
  });
};


// ✅ Stock Report with loader
const generateStockReport = async () => {
  const fromDate = reportDates.stockFrom;
  const toDate = reportDates.stockTo;

  if (!fromDate || !toDate) {
    alert("Please select both FROM and TO dates.");
    return;
  }

  await withLoader(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/report/stock-movement', {
        params: { from: fromDate, to: toDate }
      });
      const data = res.data || [];

      const doc = new jsPDF();
      let startY = addPDFHeader(doc, 'Stock In/Out Register Report', fromDate, toDate);

      doc.autoTable({
        startY: startY,
        head: [[
          { content: 'S.No', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'Medicine Name', styles: { fontStyle: 'bold', halign: 'left' } },
          { content: 'Opening', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'In', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'Out', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'Closing', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'Remarks/Feedback', styles: { fontStyle: 'bold', halign: 'center' } }
        ]],
        body: data.map((row, idx) => [
          { content: (idx + 1).toString(), styles: { halign: 'center' } },
          { content: row.name, styles: { halign: 'left' } },
          { content: (row.opening_stock ?? 0).toString(), styles: { halign: 'center' } },
          { content: (row.stock_in ?? 0).toString(), styles: { halign: 'center' } },
          { content: (row.stock_out ?? 0).toString(), styles: { halign: 'center' } },
          { content: (row.closing_stock ?? 0).toString(), styles: { halign: 'center' } },
          { content: '', styles: { halign: 'center' } }
        ]),
        theme: 'grid',
        margin: { left: 14, right: 14, bottom: 60 }, // Reserve space for signature
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.5 },
        headStyles: { fillColor: [70, 130, 180], textColor: 255, fontSize: 10, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 249, 250] }
      });

      // ✅ Check if signature space is available, avoid blank page
      const pageHeight = doc.internal.pageSize.height;
      const spaceNeeded = 60; // Space needed for signature
      if (doc.lastAutoTable.finalY + spaceNeeded > pageHeight - 60) {
        // Only add new page if absolutely necessary
        if (doc.lastAutoTable.finalY > pageHeight - 100) {
          doc.addPage();
        }
      }

      addFooterToAllPages(doc, `Stock_Register_${fromDate}_to_${toDate}.pdf`);
      addPDFSignatures(doc);
      doc.save(`Stock_Register_${fromDate}_to_${toDate}.pdf`);

      // Excel generation
      const wsData = [
        ['S.No', 'Medicine Name', 'Opening Stock', 'Stock In', 'Stock Out', 'Closing Stock', 'Remarks/Feedback'],
        ...data.map((row, idx) => [
          idx + 1,
          row.name,
          row.opening_stock ?? 0,
          row.stock_in ?? 0,
          row.stock_out ?? 0,
          row.closing_stock ?? 0,
          ''
        ])
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Stock Register");
      XLSX.writeFile(wb, `Stock_Register_${fromDate}_to_${toDate}.xlsx`);
      showReportSuccess('Stock Register');
    } catch (err) {
      console.error('Error generating stock report:', err);
      alert('Failed to generate Stock Register PDF/Excel.');
    }
  });
};

// ✅ Patient Summary Report with loader
const generateDailyPatientSummaryPDF = async (fromDate, toDate) => {
  if (!fromDate || !toDate) {
    alert("Please select both FROM and TO dates for patient summary.");
    return;
  }

  await withLoader(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/patient/daily-summary', {
        params: { from: fromDate, to: toDate }
      });
      const data = res.data;

      const doc = new jsPDF();
      let startY = addPDFHeader(doc, 'Daily Patient Summary Report', fromDate, toDate);

      const tableBody = data.map(row => [
        { content: dayjs(row.date).format('DD-MM-YYYY'), styles: { halign: 'center' } },
        { content: (row.male_student || 0).toString(), styles: { halign: 'center' } },
        { content: (row.female_student || 0).toString(), styles: { halign: 'center' } },
        { content: (row.male_staff || 0).toString(), styles: { halign: 'center' } },
        { content: (row.female_staff || 0).toString(), styles: { halign: 'center' } },
        { content: (row.total_entries || 0).toString(), styles: { halign: 'center' } },
        { content: '', styles: { halign: 'center' } }
      ]);

      doc.autoTable({
        startY: startY,
        head: [[
          { content: 'Date', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'M.Student', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'F.Student', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'M.Staff', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'F.Staff', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'Total', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'Remarks/Feedback', styles: { fontStyle: 'bold', halign: 'center' } }
        ]],
        body: tableBody,
        theme: 'grid',
        margin: { left: 14, right: 14, bottom: 60 }, // Reserve space for signature
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.5 },
        headStyles: { fillColor: [70, 130, 180], textColor: 255, fontSize: 10, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 25 }, 2: { cellWidth: 25 }, 3: { cellWidth: 25 }, 4: { cellWidth: 25 }, 5: { cellWidth: 20 }, 6: { cellWidth: 40 } }
      });

      // ✅ Check if signature space is available, avoid blank page
      const pageHeight = doc.internal.pageSize.height;
      const spaceNeeded = 60; // Space needed for signature
      if (doc.lastAutoTable.finalY + spaceNeeded > pageHeight - 60) {
        // Only add new page if absolutely necessary
        if (doc.lastAutoTable.finalY > pageHeight - 100) {
          doc.addPage();
        }
      }

      addFooterToAllPages(doc, `Daily_Patient_Summary_${fromDate}_to_${toDate}.pdf`);
      addPDFSignatures(doc);
      doc.save(`Daily_Patient_Summary_${fromDate}_to_${toDate}.pdf`);
      showReportSuccess('Patient Summary');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Error generating daily summary PDF');
    }
  });
};


  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="header">
          <img src={logo} alt="TCE Logo" className="header-logo" />
          <h1>TCE Dispensary</h1>
          <h3>Thiagarajar College Of Engineering</h3>
        </div>

        {/* Menu Buttons */}
        <div className="menu-container">
          <div className="menu-row-top">
            <button className="menu-button" onClick={() => handleNavigation('/PatientDiagnosis')}>
              Patient Diagnosis
            </button>
            <button className="menu-button" onClick={() => handleNavigation('/BillEntry')}>
              Purchase Bill Entry
            </button>
            <button className="menu-button" onClick={() => handleNavigation('/AddPatient')}>
              New Patient Register
            </button>
          </div>
          
          <div className="menu-row-bottom">
            <button className="menu-button" onClick={() => handleNavigation('/RequirementQuotation')}>
              Requirement Quotation
            </button>
            <button className="menu-button" onClick={() => handleNavigation('/MedicineManagement')}>
              Medicine Management
            </button>
          </div>
        </div>

        {/* ✅ Reports Section with Cascade Slider */}
        <div className="section">
          <div className="reports-header" onClick={toggleReports}>
            <h2>Reports & Analytics</h2>
            <motion.div
  className="reports-arrow"
  animate={{ rotate: reportsExpanded ? 180 : 0 }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 10l5 5 5-5z"/>
  </svg>
</motion.div>

          </div>
          
          <AnimatePresence>
            {reportsExpanded && (
              <motion.div
                className="reports-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                {/* Purchase Report */}
                <motion.div
                  className="report-row"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <label>Purchase Bills:</label>
                  <input 
                    type="date" 
                    name="purchaseFrom" 
                    value={reportDates.purchaseFrom}
                    onChange={handleDateChange}
                    placeholder="From" 
                  />
                  <input 
                    type="date" 
                    name="purchaseTo" 
                    value={reportDates.purchaseTo}
                    onChange={handleDateChange}
                    placeholder="To" 
                  />
                  <button className="generate-btn" onClick={() => generateReport('purchase')}>
                    Generate PDF
                  </button>
                </motion.div>

                {/* Stock Report */}
                <motion.div
                  className="report-row"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <label>Stock Register:</label>
                  <input 
                    type="date" 
                    name="stockFrom" 
                    value={reportDates.stockFrom}
                    onChange={handleDateChange}
                    placeholder="From" 
                  />
                  <input 
                    type="date" 
                    name="stockTo" 
                    value={reportDates.stockTo}
                    onChange={handleDateChange}
                    placeholder="To" 
                  />
                  <button className="generate-btn" onClick={generateStockReport}>
                    Generate PDF + Excel
                  </button>
                </motion.div>

                {/* Patient Summary Report */}
                <motion.div
                  className="report-row"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <label>Patient Summary:</label>
                  <input 
                    type="date" 
                    name="entryFrom" 
                    value={reportDates.entryFrom}
                    onChange={handleDateChange}
                    placeholder="From" 
                  />
                  <input 
                    type="date" 
                    name="entryTo" 
                    value={reportDates.entryTo}
                    onChange={handleDateChange}
                    placeholder="To" 
                  />
                  <button 
                    className="generate-btn" 
                    onClick={() => generateDailyPatientSummaryPDF(reportDates.entryFrom, reportDates.entryTo)}
                  >
                    Generate PDF
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
