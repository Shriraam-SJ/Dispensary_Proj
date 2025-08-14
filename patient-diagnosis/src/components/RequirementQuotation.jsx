import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';
import '../styles/RequirementQuotation.css';
import logo from '../assets/tce-logo.png';

const RequirementQuotation = () => {
  const navigate = useNavigate();
  const [quotationItems, setQuotationItems] = useState([
    {
      id: 1,
      nameOfParticular: '',
      doseQuantity: '',
      rate: '',
      requirement: ''
    }
  ]);

  const [quotationInfo, setQuotationInfo] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    quotationNumber: '',
    remarks: ''
  });

  // Handle quotation info changes
  const handleQuotationInfoChange = (e) => {
    const { name, value } = e.target;
    setQuotationInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle item changes
  const handleItemChange = (id, field, value) => {
    setQuotationItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Add new row
  const addNewRow = () => {
    const newId = Math.max(...quotationItems.map(item => item.id)) + 1;
    setQuotationItems(prev => [
      ...prev,
      {
        id: newId,
        nameOfParticular: '',
        doseQuantity: '',
        rate: '',
        requirement: ''
      }
    ]);
  };

  // Remove row
  const removeRow = (id) => {
    if (quotationItems.length > 1) {
      setQuotationItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Generate PDF (Updated to match your other reports' style)
  const generateQuotationPDF = () => {
    // Validate required fields
    if (!quotationInfo.quotationNumber) {
      alert('Please enter quotation number');
      return;
    }

    const validItems = quotationItems.filter(item => 
      item.nameOfParticular.trim() !== ''
    );

    if (validItems.length === 0) {
      alert('Please add at least one medicine item');
      return;
    }

    const doc = new jsPDF();

    // Header styling (matching your other reports)
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('TCE Dispensary', 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text('Medical Indent', 14, 29);

    // Date and quotation info
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Date: ${dayjs(quotationInfo.date).format('DD-MM-YYYY')}`, 14, 37);
    doc.text(`Quotation No: ${quotationInfo.quotationNumber}`, 120, 37);

    let startY = 48;

    // Table with only entered rows (no extra empty rows)
    doc.autoTable({
      startY: startY,
      head: [
        [
          { content: 'S.No', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'Name of Particular', styles: { fontStyle: 'bold', halign: 'left' } },
          { content: 'Dose/ Quantity', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'Rate', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'Requirement', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: 'Remarks', styles: { fontStyle: 'bold', halign: 'center' } }
        ]
      ],
      body: validItems.map((item, index) => [
        { content: (index + 1).toString(), styles: { halign: 'center' } },
        { content: item.nameOfParticular, styles: { halign: 'left' } },
        { content: item.doseQuantity || '', styles: { halign: 'center' } },
        { content: item.rate || '', styles: { halign: 'center' } },
        { content: item.requirement || '', styles: { halign: 'center' } },
        { content: '', styles: { halign: 'center' } }
      ]),
      theme: 'grid',
      margin: { left: 14, right: 14, bottom: 60 },
      styles: { 
        font: 'helvetica', 
        fontSize: 10, 
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.5
      },
      headStyles: { 
        fillColor: [70, 130, 180], 
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      alternateRowStyles: { 
        fillColor: [248, 249, 250] 
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 50 },
        2: { cellWidth: 23 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
        5: { cellWidth: 30 }
      }
    });

    // Add footer with signatures to all pages (Staff and Manager only)
    const addFooterToAllPages = () => {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Generation timestamp
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Generated on: ${dayjs().format('DD-MM-YYYY HH:mm')} | Page ${i} of ${pageCount}`,
          14,
          doc.internal.pageSize.height - 45
        );
        
        // Add signatures (Staff and Manager only)
        const pageHeight = doc.internal.pageSize.height;
        const signatureY = pageHeight - 30;
        
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        
        // Staff signature on the left
        doc.text('Staff Signature', 14, signatureY);
        doc.text('_________________', 14, signatureY + 8);
        
        // Manager signature on the right
        const pageWidth = doc.internal.pageSize.width;
        doc.text('Manager', pageWidth - 50, signatureY);
        doc.text('_________________', pageWidth - 65, signatureY + 8);
      }
    };

    // Add footer to all pages
    addFooterToAllPages();

    // Save PDF
    doc.save(`Medical_Indent_${quotationInfo.quotationNumber}_${dayjs().format('YYYY-MM-DD')}.pdf`);
  };

  // Reset form
  const resetForm = () => {
    setQuotationItems([
      {
        id: 1,
        nameOfParticular: '',
        doseQuantity: '',
        rate: '',
        requirement: ''
      }
    ]);
    setQuotationInfo({
      date: dayjs().format('YYYY-MM-DD'),
      quotationNumber: '',
      remarks: ''
    });
  };

  // Handle back button
  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="requirement-page">
      <div className="requirement-container">
        <div className="header">
          <img src={logo} alt="TCE Logo" className="header-logo" />
          <h1>Medical Indent / Requirement Quotation</h1>
          <h3>Thiagarajar College Of Engineering</h3>
        </div>

        <div className="button-container">
          <button onClick={handleBack} className="back-btn">
            Back to Dashboard
          </button>
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          {/* Quotation Info Section */}
          <div className="form-section">
            <h3>Quotation Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  name="date"
                  value={quotationInfo.date}
                  onChange={handleQuotationInfoChange}
                />
              </div>
              <div className="form-group">
                <label>Quotation Number:</label>
                <input
                  type="text"
                  name="quotationNumber"
                  value={quotationInfo.quotationNumber}
                  onChange={handleQuotationInfoChange}
                  placeholder="Enter quotation number"
                />
              </div>
            </div>
          </div>

          {/* Medicine Requirements Section */}
          <div className="form-section">
            <h3>Medicine Requirements</h3>
            <table className="medicine-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Name of Particular</th>
                  <th>Dose/Quantity</th>
                  <th>Rate</th>
                  <th>Requirement</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {quotationItems.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        value={item.nameOfParticular}
                        onChange={(e) => handleItemChange(item.id, 'nameOfParticular', e.target.value)}
                        placeholder="Medicine name"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.doseQuantity}
                        onChange={(e) => handleItemChange(item.id, 'doseQuantity', e.target.value)}
                        placeholder="Dose/Qty"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.rate}
                        onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                        placeholder="Rate"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.requirement}
                        onChange={(e) => handleItemChange(item.id, 'requirement', e.target.value)}
                        placeholder="Requirement"
                      />
                    </td>
                    <td>
                      <button 
                        type="button"
                        onClick={() => removeRow(item.id)}
                        className="remove-btn"
                        disabled={quotationItems.length === 1}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="add-btn-container">
              <button type="button" onClick={addNewRow} className="add-row-btn">
                + Add New Row
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button type="button" onClick={generateQuotationPDF} className="submit-btn">
              Generate PDF
            </button>
            <button type="button" onClick={resetForm} className="reset-btn">
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequirementQuotation;
