import React, { useState, useEffect } from 'react';
import '../styles/Add_Patient.css';
import logo from '../assets/tce-logo.png';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const AddPatient = () => {
  const navigate = useNavigate();
  const location = useLocation();
console.log("📦 Location state:", location.state);

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

  // ✅ Fetch data only if editing
  useEffect(() => {
    if (isEdit && editData.regno) {
      axios.get(`http://localhost:5000/api/patients/get-patient/${editData.regno}`)
        .then(res => {
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
              stayType:fetched.stay_type || ''
            });
          }
        })
        .catch(err => {
          console.error("Error loading patient:", err);
          alert("❌ Error fetching patient details");
        });
    }
  }, [isEdit, editData.regno]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBack = () => navigate('/dashboard');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/patients/add-patient', formData);
      alert('✅ Patient Added:\n' + JSON.stringify(res.data.patient, null, 2));
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 409) {
        alert('⚠️ Patient already exists.');
      } else {
        alert('❌ Error adding patient');
        console.error(error);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`http://localhost:5000/api/patients/update-patient/${formData.regno}`, formData);
      alert('✅ Patient Updated:\n' + JSON.stringify(res.data.updatedPatient, null, 2));
      navigate('/dashboard');
    } catch (err) {
      console.error("❌ Edit Error:", err);
      alert("❌ Failed to update patient");
    }
  };

  return (
    <div className="add-patient-page">
      <div className="center">
        <form id="formBox" onSubmit={isEdit ? handleUpdate : handleSubmit}>
          <button type="button" className="back-btn" onClick={handleBack}>
            ← Back to Dashboard
          </button>

          <div className="header">
            <img src={logo} alt="TCE Logo" className="header-logo" />
            <h1>{isEdit ? 'Edit Patient' : 'New Patient'}</h1>
            <h3>Thiagarajar College Of Engineering - Dispensary</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Patient Name <span className="required">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Register Number\Mobile No <span className="required">*</span></label>
              <input
                type="text"
                name="regno"
                value={formData.regno}
                onChange={handleChange}
                required
                readOnly={isEdit}
              />
            </div>

            <div className="form-group">
              <label>Gender <span className="required">*</span></label>
              <select name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Age <span className="required">*</span></label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
  <label>Stay Type <span className="required">*</span></label><br />
  <select
    name="stayType"
    value={formData.stayType || ''}
    onChange={handleChange}
    required
  >
    <option value="">Select Stay Type</option>
    <option value="Hosteller">Hosteller</option>
    <option value="DayScholar">Day Scholar</option>
  </select>
</div>

          <div className="form-row">
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
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="date">Date <span className="required">*</span></label><br />
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <label>Type <span className="required">*</span></label><br />
            <select name="type" value={formData.type} onChange={handleChange} required>
              <option value="">Select Type</option>
              <option value="Student">Student</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

          <div className="form-row">
            <label>Mobile <span className="required">*</span></label><br />
            <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} required />
          </div>

          <button type="submit" className='submit-btn'>
            {isEdit ? 'Save Changes' : 'Add Patient'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
