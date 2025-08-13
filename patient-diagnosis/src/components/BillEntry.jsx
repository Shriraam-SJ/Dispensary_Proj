import React, { useState, useEffect, useRef } from 'react';

import '../styles/BillEntry.css';
import logo from '../assets/tce-logo.png';
import { useNavigate } from 'react-router-dom';
import axios  from 'axios';


const BillEntry = () => {
  const [billInfo, setBillInfo] = useState({ dateOfPurchase: '', billNumber: '', enterpriseName: '' });


  const [billItems, setBillItems] = useState([
    {
      id: 1,
      medicineName: '',
      quantity: '',
      pricePerUnit: '',
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
  const handleMedicineNameChange = (itemId, value) => {
    setBillItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, medicineName: value }
        : item
    ));

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

  // Handle medicine selection from dropdown
  const handleMedicineSelect = (itemId, medicine) => {
    setBillItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, medicineName: medicine.name }
        : item
    ));
    setDropdowns(prev => ({
      ...prev,
      medicines: {
        ...prev.medicines,
        [itemId]: { show: false, items: [] }
      }
    }));
  };

  // Handle item field changes
const handleItemChange = (itemId, field, value) => {
  setBillItems(prev =>
    prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item };

        // Convert quantity and pricePerUnit to numbers
        if (field === 'quantity' || field === 'pricePerUnit') {
          updatedItem[field] = parseFloat(value) || 0;
        } else {
          updatedItem[field] = value;
        }

        // Auto-calculate total cost
        const quantity = parseFloat(updatedItem.quantity) || 0;
        const pricePerUnit = parseFloat(updatedItem.pricePerUnit) || 0;
        updatedItem.totalCost = quantity * pricePerUnit;

        return updatedItem;
      }
      return item;
    })
  );
};


  // Add new item row
  const addItemRow = () => {
    const newId = Math.max(...billItems.map(item => item.id)) + 1;
    setBillItems(prev => [...prev, {
      id: newId,
      medicineName: '',
      quantity: '',
      pricePerUnit: '',
      totalCost: 0
    }]);
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

  // Validate items
  const validItems = billItems.filter(item =>
    item.medicineName && item.quantity && item.pricePerUnit
  );

  if (validItems.length === 0) {
    alert('Please add at least one valid item.');
    return;
  }

  // Prepare submission data
  const submissionData = {
    billInfo,
    items: validItems.map(item => ({
      medicineName: item.medicineName,
      quantity: parseFloat(item.quantity),
      pricePerUnit: parseFloat(item.pricePerUnit),
      totalCost: item.totalCost
    })),
    grandTotal: calculateGrandTotal()
  };

  try {
    await axios.post('http://localhost:5000/api/bills/submit-bill', submissionData);
    alert('✅ Bill submitted and stock updated!');
    navigate('/dashboard');
  } catch (err) {
    console.error('Submit failed:', err);
    alert('❌ Failed to submit bill entry.');
  }

  // Reset form
  setBillInfo({ dateOfPurchase: '', billNumber: '' });
  setBillItems([{
    id: 1,
    medicineName: '',
    quantity: '',
    pricePerUnit: '',
    totalCost: 0
  }]);
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
      const res = await axios.get('http://localhost:5000/api/medicines'); // Adjust your API path
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
                  <th>Quantity</th>
                  <th>Price per Unit (₹)</th>
                  <th>Total Cost (₹)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {billItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div 
                        style={{ position: 'relative' }}
                        ref={el => dropdownRefs.current[`medicine-${item.id}`] = el}
                      >
                        <input
                          type="text"
                          value={item.medicineName}
                          onChange={(e) => handleMedicineNameChange(item.id, e.target.value)}
                          placeholder="Search medicine..."
                          autoComplete="off"
                        />
                        <div 
                          className={`dropdown-list medicine-dropdown ${
                            dropdowns.medicines[item.id]?.show ? 'show' : ''
                          }`}
                        >
                          {(dropdowns.medicines[item.id]?.items || []).map(medicine => (
                            <div
                              key={medicine.id}
                              className="dropdown-item"
                              onClick={() => handleMedicineSelect(item.id, medicine)}
                            >
                              {medicine.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        placeholder="Qty"
                        min="0"
                        step="1"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.pricePerUnit}
                        onChange={(e) => handleItemChange(item.id, 'pricePerUnit', e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="total-cost">
                      ₹{item.totalCost.toFixed(2)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeItemRow(item.id)}
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
