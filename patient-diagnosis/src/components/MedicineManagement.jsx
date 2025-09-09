import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoader } from '../providers/LoaderProvider';
import { showReportSuccess } from '../utils/notifications';
import axios from 'axios';
import '../styles/MedicineManagement.css';
import logo from '../assets/tce-logo.png';

const MedicineManagement = () => {
  const navigate = useNavigate();
  const { withLoader } = useLoader();
  
  const [activeTab, setActiveTab] = useState('add');
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form data matching your DB structure
  const [formData, setFormData] = useState({
    name: '',
    stock: '',
    price_per_unit: ''
  });
  
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  
  // Fetch all medicines
  const fetchMedicines = async () => {
    try {
      const res = await axios.get('https://dispensary-proj.onrender.com/api/medicines');
      setMedicines(res.data);
    } catch (err) {
      console.error('Failed to fetch medicines:', err);
      alert('Failed to load medicines');
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Add new medicine
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.stock) {
      alert('Please fill in medicine name and stock quantity');
      return;
    }

    await withLoader(async () => {
      try {
        await axios.post('https://dispensary-proj.onrender.com/api/medicines/add', {
          name: formData.name,
          stock: parseInt(formData.stock),
          price_per_unit: formData.price_per_unit ? parseFloat(formData.price_per_unit) : null
        });
        
        showReportSuccess('Medicine Added');
        setFormData({ name: '', stock: '', price_per_unit: '' });
        fetchMedicines();
      } catch (err) {
        console.error('Add medicine error:', err);
        alert(err.response?.data?.error || 'Failed to add medicine');
      }
    });
  };

  // Update medicine
  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    
    if (!selectedMedicine) {
      alert('Please select a medicine to update');
      return;
    }

    await withLoader(async () => {
      try {
        await axios.put(`https://dispensary-proj.onrender.com/api/medicines/update/${selectedMedicine.id}`, {
          name: formData.name,
          stock: parseInt(formData.stock),
          price_per_unit: formData.price_per_unit ? parseFloat(formData.price_per_unit) : null
        });
        
        showReportSuccess('Medicine Updated');
        setSelectedMedicine(null);
        setFormData({ name: '', stock: '', price_per_unit: '' });
        fetchMedicines();
      } catch (err) {
        console.error('Update medicine error:', err);
        alert(err.response?.data?.error || 'Failed to update medicine');
      }
    });
  };

  // Remove medicine
  const handleRemoveMedicine = async (medicineId) => {
    if (!window.confirm('Are you sure you want to remove this medicine?')) {
      return;
    }

    await withLoader(async () => {
      try {
        await axios.delete(`https://dispensary-proj.onrender.com/api/medicines/remove/${medicineId}`);
        showReportSuccess('Medicine Removed');
        fetchMedicines();
      } catch (err) {
        console.error('Remove medicine error:', err);
        alert(err.response?.data?.error || 'Failed to remove medicine, This medicine is in USE');
      }
    });
  };

  // Select medicine for update
  const selectMedicineForUpdate = (medicine) => {
    setSelectedMedicine(medicine);
    setFormData({
      name: medicine.name,
      stock: medicine.stock.toString(),
      price_per_unit: medicine.price_per_unit ? medicine.price_per_unit.toString() : ''
    });
  };

  // Filter medicines based on search
  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="medicine-management-page">
      <div className="medicine-container">
        <div className="header">
          <img src={logo} alt="TCE Logo" className="header-logo" />
          <h1>Medicine Management</h1>
          <h3>Add, Update & Remove Medicines</h3>
        </div>

        <div className="button-container">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Medicine
          </button>
          <button 
            className={`tab-btn ${activeTab === 'update' ? 'active' : ''}`}
            onClick={() => setActiveTab('update')}
          >
            Update Medicine
          </button>
          {/* <button 
            className={`tab-btn ${activeTab === 'remove' ? 'active' : ''}`}
            onClick={() => setActiveTab('remove')}
          >
            Remove Medicine
          </button> */}
        </div>

        {/* Add Medicine Tab */}
        {activeTab === 'add' && (
          <div className="tab-content">
            <h2>Add New Medicine</h2>
            <form onSubmit={handleAddMedicine} className="medicine-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Medicine Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter medicine name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="Enter stock quantity"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Price per Unit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price_per_unit"
                    value={formData.price_per_unit}
                    onChange={handleInputChange}
                    placeholder="Enter price per unit (optional)"
                    min="0"
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn">
                Add Medicine
              </button>
            </form>
          </div>
        )}

        {/* Update Medicine Tab */}
        {activeTab === 'update' && (
          <div className="tab-content">
            <h2>Update Medicine</h2>
            
            <div className="medicine-search">
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="medicines-list">
              {filteredMedicines.map(medicine => (
                <div key={medicine.id} className="medicine-item">
                  <div className="medicine-info">
                    <h4>{medicine.name}</h4>
                    <p>Stock: {medicine.stock} units</p>
                    {medicine.price_per_unit && (
                      <p>Price: ₹{parseFloat(medicine.price_per_unit).toFixed(2)}</p>
                    )}
                    <p>Last Updated: {medicine.last_updated ? new Date(medicine.last_updated).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <button 
                    className="select-btn"
                    onClick={() => selectMedicineForUpdate(medicine)}
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>

            {selectedMedicine && (
              <form onSubmit={handleUpdateMedicine} className="medicine-form">
                <h3>Updating: {selectedMedicine.name}</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Medicine Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Price per Unit (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="price_per_unit"
                      value={formData.price_per_unit}
                      onChange={handleInputChange}
                      placeholder="Enter price per unit (optional)"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    Update Medicine
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setSelectedMedicine(null);
                      setFormData({ name: '', stock: '', price_per_unit: '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Remove Medicine Tab */}
        {/* {activeTab === 'remove' && (
          <div className="tab-content">
            <h2>Remove Medicine</h2>
            
            <div className="medicine-search">
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="medicines-list">
              {filteredMedicines.map(medicine => (
                <div key={medicine.id} className="medicine-item">
                  <div className="medicine-info">
                    <h4>{medicine.name}</h4>
                    <p>Stock: {medicine.stock} units</p>
                    {medicine.price_per_unit && (
                      <p>Price: ₹{parseFloat(medicine.price_per_unit).toFixed(2)}</p>
                    )}
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveMedicine(medicine.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default MedicineManagement;
