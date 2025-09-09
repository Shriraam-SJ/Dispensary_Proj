import React, { useState, useEffect, useRef } from 'react';

import '../styles/BillEntry.css';
import logo from '../assets/tce-logo.png';
import { useNavigate } from 'react-router-dom';
import axios  from 'axios';
import { useLoader } from '../providers/LoaderProvider';

const BillEntry = () => {
  const { withLoader } = useLoader();
  const [billInfo, setBillInfo] = useState({ dateOfPurchase: '', billNumber: '', enterpriseName: '' });
  const [validationErrors, setValidationErrors] = useState({});


  const [billItems, setBillItems] = useState([
  { 
    id: 1, 
    medicineName: '', 
    units: '', // boxes
    pricePerBox: '', 
    piecesPerBox: '',
    totalCost: 0 
  }
]);

  const [dropdowns, setDropdowns] = useState({
    medicines: {}
  });

  const navigate = useNavigate();
  
  const dropdownRefs = useRef({});

  // Handle bill info changes
  const handleBillInfoChange = (e) => {
    const { name, value } = e.target;
    setBillInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle medicine name autocomplete
  // Handle medicine name autocomplete
const handleMedicineNameChange = (itemId, value) => {
  setBillItems(prev => prev.map(item => 
    item.id === itemId ? { ...item, medicineName: value } : item
  ));

  // Clear previous error for this field
  setValidationErrors(prev => {
    const newErrors = { ...prev };
    delete newErrors[`medicine_${itemId}`];
    return newErrors;
  });

  if (value.length > 0) {
    const matches = availableMedicines.filter(medicine =>
      medicine.name.toLowerCase().includes(value.toLowerCase())
    );
    
    setDropdowns(prev => ({
      ...prev,
      medicines: {
        ...prev.medicines,
        [itemId]: { show: true, items: matches }
      }
    }));
  } else {
    setDropdowns(prev => ({
      ...prev,
      medicines: {
        ...prev.medicines,
        [itemId]: { show: false, items: [] }
      }
    }));
  }
};
const validateMedicineName = (itemId, medicineName) => {
  if (!medicineName.trim()) return true; // Allow empty for now
  
  const exists = availableMedicines.some(medicine => 
    medicine.name.toLowerCase() === medicineName.toLowerCase().trim()
  );
  
  if (!exists) {
    setValidationErrors(prev => ({
      ...prev,
      [`medicine_${itemId}`]: "Enter a medicine that is already added"
    }));
    return false;
  }
  
  // Clear error if medicine exists
  setValidationErrors(prev => {
    const newErrors = { ...prev };
    delete newErrors[`medicine_${itemId}`];
    return newErrors;
  });
  
  return true;
};


  // Handle medicine selection from dropdown
  // Handle medicine selection from dropdown
const handleMedicineSelect = (itemId, medicine) => {
  setBillItems(prev => prev.map(item => 
    item.id === itemId 
      ? { ...item, medicineName: medicine.name }
      : item
  ));
  
  // Hide dropdown after selection
  setDropdowns(prev => ({
    ...prev,
    medicines: {
      ...prev.medicines,
      [itemId]: { show: false, items: [] }
    }
  }));

  // Clear any validation errors for this field
  setValidationErrors(prev => {
    const newErrors = { ...prev };
    delete newErrors[`medicine_${itemId}`];
    return newErrors;
  });
};


  // Handle item field changes
const handleItemChange = (itemId, field, value) => {
  setBillItems(prev => prev.map(item => {
    if (item.id === itemId) {
      const updatedItem = { ...item };
      
      // Convert numeric fields to numbers
      if (field === 'units' || field === 'pricePerBox' || field === 'piecesPerBox') {
        updatedItem[field] = parseFloat(value) || 0;
      } else {
        updatedItem[field] = value;
      }
      
      // Auto-calculate total cost (units × price per box)
      const units = parseFloat(updatedItem.units) || 0;
      const pricePerBox = parseFloat(updatedItem.pricePerBox) || 0;
      updatedItem.totalCost = units * pricePerBox;
      
      return updatedItem;
    }
    return item;
  }));
};



  // Add new item row
  const addItemRow = () => {
  const newId = Math.max(...billItems.map(item => item.id)) + 1;
  setBillItems(prev => [...prev, { 
    id: newId, 
    medicineName: '', 
    units: '', 
    pricePerBox: '', 
    piecesPerBox: '',
    totalCost: 0 
  }]);
};
const handleMedicineNameBlur = (itemId, value) => {
  if (value.trim()) {
    validateMedicineName(itemId, value);
  }
};

  // Remove item row
  const removeItemRow = (itemId) => {
    if (billItems.length > 1) {
      setBillItems(prev => prev.filter(item => item.id !== itemId));
      setDropdowns(prev => ({
        ...prev,
        medicines: {
          ...prev.medicines,
          [itemId]: undefined
        }
      }));
    } else {
      alert('At least one item row is required.');
    }
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    return billItems.reduce((total, item) => total + (item.totalCost || 0), 0).toFixed(2);
  };

  // Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate bill info
  if (!billInfo.dateOfPurchase || !billInfo.billNumber) {
    alert('Please enter both date of purchase and bill number.');
    return;
  }

  // Validate medicine names exist
  let hasValidationErrors = false;
  billItems.forEach(item => {
    if (item.medicineName && !validateMedicineName(item.id, item.medicineName)) {
      hasValidationErrors = true;
    }
  });

  if (hasValidationErrors) {
    alert('Please fix the medicine name errors before submitting.');
    return;
  }

  // Validate items
  const validItems = billItems.filter(item => 
    item.medicineName && 
    item.units && 
    item.pricePerBox && 
    item.piecesPerBox &&
    availableMedicines.some(med => 
      med.name.toLowerCase() === item.medicineName.toLowerCase().trim()
    )
  );

  if (validItems.length === 0) {
    alert('Please add at least one valid item with all fields filled and valid medicine names.');
    return;
  }
  
  // Prepare submission data
  const submissionData = {
    billInfo,
    items: validItems.map(item => ({
      medicineName: item.medicineName,
      quantity: parseFloat(item.units) * parseFloat(item.piecesPerBox),
      units: parseFloat(item.units),// units × pieces per box
      pricePerUnit: parseFloat(item.pricePerBox),
      totalCost: item.totalCost // units × price per box
    })),
    grandTotal: calculateGrandTotal()
  };
  await withLoader(async () => {
  try {
    await axios.post('https://dispensary-proj.onrender.com/api/bills/submit-bill', submissionData);
    alert('✅ Bill submitted and stock updated!');
    navigate('/dashboard');
  } catch (err) {
    console.error('Submit failed:', err);
    alert('❌ Failed to submit bill entry.');
  }
  
  // Reset form
  setBillInfo({ dateOfPurchase: '', billNumber: '', enterpriseName: '' });
  setBillItems([{ 
    id: 1, 
    medicineName: '', 
    units: '', 
    pricePerBox: '', 
    piecesPerBox: '',
    totalCost: 0 
  }]);
  });
};



  // Handle back button
  const handleBack = () => {
    navigate('/dashboard')
  };

  // Set current date as default
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setBillInfo(prev => ({
      ...prev,
      dateOfPurchase: today
    }));
  }, []);

  const [availableMedicines, setAvailableMedicines] = useState([]);

useEffect(() => {
  const fetchMedicines = async () => {
    try {
      const res = await axios.get('https://dispensary-proj.onrender.com/api/medicines'); // Adjust your API path
      setAvailableMedicines(res.data); // Expected format: [{ id, name }]
    } catch (err) {
      console.error('Failed to fetch medicines:', err);
    }
  };

  fetchMedicines();
}, []);


  // Hide dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      let shouldHide = true;
      
      Object.keys(dropdownRefs.current).forEach(key => {
        const ref = dropdownRefs.current[key];
        if (ref && ref.contains(event.target)) {
          shouldHide = false;
        }
      });

      if (shouldHide) {
        setDropdowns(prev => ({
          medicines: Object.keys(prev.medicines).reduce((acc, key) => {
            acc[key] = { show: false, items: [] };
            return acc;
          }, {})
        }));
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="bill-entry-page">
    <div className="bill-entry-container">
      <button className="back-btn" onClick={handleBack}>
        ← Back to Dashboard
      </button>
      
      <div className="header">
        <img src={logo} alt="TCE Logo" className="header-logo" />
        <h1>Medicine Purchase Entry</h1>
        <h3>Thiagarajar College Of Engineering - Dispensary</h3>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Bill Information Section */}
        <div className="form-section">
          <h4 style={{ marginTop: 0, color: '#004080', marginBottom: '20px' }}>Bill Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dateOfPurchase">Date of Purchase *</label>
              <input
                type="date"
                id="dateOfPurchase"
                name="dateOfPurchase"
                value={billInfo.dateOfPurchase}
                onChange={handleBillInfoChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="billNumber">Invoice Number *</label>
              <input
                type="text"
                id="billNumber"
                name="billNumber"
                value={billInfo.billNumber}
                onChange={handleBillInfoChange}
                placeholder="Enter Invoice number"
                required
              />
            </div>
            <div className="form-group">
              <label>Enterprise Name</label>
              <input
                type="text"
                name="enterpriseName"
                value={billInfo.enterpriseName}
                onChange={handleBillInfoChange}
                placeholder="Enter Enterprise Name"
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="form-section">
          <h4 style={{ marginTop: 0, color: '#004080', marginBottom: '15px' }}>Medicine Items</h4>
          <div className="table-container">
            <table className="bill-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Units (Boxes)</th>
                  <th>Price per Box</th>
                  <th>Pieces per Box</th>
                  <th>Total Cost</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {billItems.map((item) => (
  <tr key={item.id}>
    <td>
      <div 
        className="medicine-input-container"
        ref={(el) => {
          if (el) {
            dropdownRefs.current[item.id] = el;
          }
        }}
      >
        <input
          type="text"
          className="medicine-input"
          value={item.medicineName}
          onChange={(e) => handleMedicineNameChange(item.id, e.target.value)}
          onBlur={(e) => handleMedicineNameBlur(item.id, e.target.value)}
          placeholder="Enter medicine name"
          style={{
            borderColor: validationErrors[`medicine_${item.id}`] ? '#dc3545' : '#ccc'
          }}
        />
        {validationErrors[`medicine_${item.id}`] && (
          <div className="error-message">
            {validationErrors[`medicine_${item.id}`]}
          </div>
        )}
        {dropdowns.medicines[item.id]?.show && dropdowns.medicines[item.id]?.items?.length > 0 && (
          <div className="dropdown-menu">
            {dropdowns.medicines[item.id].items.map(medicine => (
              <div
                key={medicine.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMedicineSelect(item.id, medicine);
                }}
                className="dropdown-item"
              >
                {medicine.name}
              </div>
            ))}
            {dropdowns.medicines[item.id].items.length === 0 && (
              <div className="dropdown-item" style={{ color: '#999', cursor: 'default' }}>
                No medicines found
              </div>
            )}
          </div>
        )}
      </div>
    </td>
    
    <td>
      <input
        type="number"
        value={item.units}
        onChange={(e) => handleItemChange(item.id, 'units', e.target.value)}
        placeholder="Units"
        min="0"
        step="1"
        required
      />
    </td>
    
    <td>
      <input
        type="number"
        value={item.pricePerBox}
        onChange={(e) => handleItemChange(item.id, 'pricePerBox', e.target.value)}
        placeholder="Price per box"
        min="0"
        step="0.01"
        required
      />
    </td>
    
    <td>
      <input
        type="number"
        value={item.piecesPerBox}
        onChange={(e) => handleItemChange(item.id, 'piecesPerBox', e.target.value)}
        placeholder="Pieces per box"
        min="1"
        step="1"
        required
      />
    </td>
    
    <td>
      <span>₹{item.totalCost.toFixed(2)}</span>
    </td>
    
    <td>
      <button 
        type="button" 
        onClick={() => removeItemRow(item.id)}
        className="remove-btn"
      >
        Remove
      </button>
    </td>
  </tr>
))}
              </tbody>
            </table>
          </div>
          
          <button type="button" className="add-row-btn" onClick={addItemRow}>
            + Add Item
          </button>
        </div>

        {/* Total Summary */}
        <div className="total-summary">
          <div>Total Items: <strong>{billItems.length}</strong></div>
          <div className="total-amount">
            Grand Total: ₹{calculateGrandTotal()}
          </div>
        </div>
{/* ❌ Remove onSubmit from button. It should be on form */}
<button type="submit" className="submit-btn">
  Submit Bill Entry
</button>

      </form>
    </div>
   </div> 
  );
};

export default BillEntry;
