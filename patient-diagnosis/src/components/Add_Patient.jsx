import React, { useState, useEffect } from 'react';
import '../styles/Add_Patient.css';
import logo from '../assets/tce-logo.png';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useLoader } from '../providers/LoaderProvider';
const AddPatient = () => {
  const { withLoader } = useLoader();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isEdit = location.state?.edit || false;
  const editData = location.state?.data || {};
  
  const [formData, setFormData] = useState({
    regno: '',
    name: '',
    age: '',
    gender: '',
    date: '',
    type: 'Student',
    mobile: '',
    department: '',
    stayType: ''
  });

  const [mobileError, setMobileError] = useState('');
  const [isEditMode, setIsEditMode] = useState(isEdit);
  
  // ✅ NEW: Live search states
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isEdit && editData.regno) {
      fetchPatientData(editData.regno);
    }
  }, [isEdit, editData.regno]);

  // ✅ NEW: Live search function - searches as you type
  const searchPatients = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/patients/search-patients?term=${searchTerm}`);
      if (res.data.success) {
        setSearchResults(res.data.patients);
        setShowDropdown(true);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
      setShowDropdown(false);
    }
    setIsSearching(false);
  };

  const fetchPatientData = async (regno) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/patients/get-patient/${regno}`);
      if (res.data.success) {
        const fetched = res.data.patient;
        setFormData({
          regno: fetched.regno || '',
          name: fetched.name || '',
          age: fetched.age || '',
          gender: fetched.gender || '',
          date: fetched.date?.substring(0, 10) || '',
          type: fetched.type || 'Student',
          mobile: fetched.mobile || '',
          department: fetched.department || '',
          stayType: fetched.stay_type || ''
        });
        setIsEditMode(true);
        setShowDropdown(false);
      }
    } catch (err) {
      console.error('Fetch patient error:', err);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'mobile') {
      setMobileError('');
    }
    
    // ✅ NEW: Live search when typing in registration number (only in edit mode)
    if (name === 'regno' && isEdit) {
      // Clear search timeout to avoid too many API calls
      clearTimeout(window.searchTimeout);
      
      if (value.trim() === '') {
        setSearchResults([]);
        setShowDropdown(false);
        setIsEditMode(false);
        // Clear other form fields when regno is empty
        setFormData({
          regno: '',
          name: '',
          age: '',
          gender: '',
          date: '',
          type: 'Student',
          mobile: '',
          department: '',
          stayType: ''
        });
        return;
      }
      
      // Search after 300ms delay to avoid too many API calls
      window.searchTimeout = setTimeout(() => {
        searchPatients(value);
      }, 300);
    }
  };

  // ✅ NEW: Handle selection from dropdown
  const handlePatientSelect = (patient) => {
    setFormData(prev => ({ ...prev, regno: patient.regno }));
    fetchPatientData(patient.regno);
    setShowDropdown(false);
  };

  // ✅ NEW: Handle clicking outside dropdown to close it
  const handleInputBlur = () => {
    // Delay hiding dropdown to allow click on dropdown items
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const handleBack = () => navigate('/dashboard');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.mobile && formData.mobile.length !== 10) {
      setMobileError('Mobile number must be exactly 10 digits');
      return;
    }
    await withLoader(async () => {
    try {
      if (isEditMode && isEdit) {
        const res = await axios.put(`http://localhost:5000/api/patients/update-patient/${formData.regno}`, formData);
        alert('✅ Patient Updated:\n' + JSON.stringify(res.data.updatedPatient, null, 2));
      } else {
        const res = await axios.post('http://localhost:5000/api/patients/add-patient', formData);
        alert('✅ Patient Added:\n' + JSON.stringify(res.data.patient, null, 2));
      }
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 409) {
        alert('⚠️ Patient already exists.');
      } else {
        alert('❌ Error processing patient');
        console.error(error);
      }
    }
    });
  };

  return (
    <div className="add-patient-page">
      <div id="formBox">
        <div className="header">
          <div className="header">
                  <img src={logo} alt="TCE Logo" className="header-logo" />
                  <h3>Thiagarajar College Of Engineering - Dispensary</h3>
                </div>
          <h1>{isEdit ? 'Edit Patient' : 'Add New Patient'}</h1>
          
          <div className="header-buttons">
            {!isEdit && (
              <button 
                type="button" 
                className="edit-btn"
                onClick={() => navigate('/AddPatient', { state: { edit: true } })}
              >
                ✏️ Edit Patient
              </button>
            )}
            
            <button className="back-btn" onClick={handleBack}>
              ← Back to Dashboard
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="regno">
                Registration Number:
                {isEdit && <span className="edit-hint"> (Type to search)</span>}
              </label>
              
              {/* ✅ NEW: Autocomplete input with dropdown */}
              <div className="autocomplete-container">
                <input
                  type="text"
                  id="regno"
                  name="regno"
                  value={formData.regno}
                  onChange={handleChange}
                  onBlur={handleInputBlur}
                  onFocus={() => {
                    if (isEdit && formData.regno && searchResults.length > 0) {
                      setShowDropdown(true);
                    }
                  }}
                  required
                  placeholder={isEdit ? "Type registration number..." : "Enter registration number"}
                  autoComplete="off"
                />
                
                {/* ✅ NEW: Search dropdown */}
                {isEdit && showDropdown && (
                  <div className="search-dropdown">
                    {isSearching ? (
                      <div className="dropdown-item loading">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(patient => (
                        <div 
                          key={patient.regno}
                          className="dropdown-item"
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <strong>{patient.regno}</strong> - {patient.name}
                        </div>
                      ))
                    ) : (
                      formData.regno && <div className="dropdown-item no-results">No patients found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Rest of your existing form fields... */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age">Age:</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender:</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date:</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Type:</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="Student">Student</option>
                <option value="Staff">Staff</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="mobile">Mobile Number:</label>
              <input
                type="text"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                maxLength="10"
                className={mobileError ? 'error-input' : ''}
              />
              {mobileError && (
                <div className="error-message">
                  {mobileError}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Department <span className="required">*</span></label><br />
            <select name="department" value={formData.department} onChange={handleChange} required>
              <option value="" disabled>Choose Department</option>
              <option value="TSEDA (Architecture, Design, Planning)">T’SEDA (Architecture, Design, Planning)</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Computer Science and Engineering">Computer Science and Engineering</option>
              <option value="Computer Science and Business Systems">Computer Science and Business Systems</option>
              <option value="Computer Applications">Computer Applications</option>
              <option value="Applied Mathematics and Computational Science">Applied Mathematics and Computational Science</option>
              <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
              <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
              <option value="English">English</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Mechatronics">Mechatronics</option>
              <option value="Physics">Physics</option>
            </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stayType">Stay Type:</label>
              <select
                id="stayType"
                name="stayType"
                value={formData.stayType}
                onChange={handleChange}
                required
              >
                <option value="">Select Stay Type</option>
                <option value="Day Scholar">Day Scholar</option>
                <option value="Hosteller">Hosteller</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button type="submit" className="submit-btn">
            {isEdit ? 'Update Patient' : 'Add Patient'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
