import React, { useState, useEffect, useRef } from 'react';
import '../styles/PatientDiagnosis.css';
import logo from '../assets/tce-logo.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { useLoader } from '../providers/LoaderProvider';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';





const PatientDiagnosis = () => {
  const { withLoader } = useLoader();
  const [formData, setFormData] = useState({
    patientName: '',
    patientRegNo: '',
    patientType: '',
  patientStayType: '',
  patientAge: '',
  patientDepartment: '',
  patientMobile: '',
    patientGender: '',
    patientProblems: '',
    patientDiagnosis: ''
  });

  const [medicineRows, setMedicineRows] = useState([
    {
      id: 1,
      medicineName: '',
      availableStock: '',
      quantity: '1',
      instructions: ''
    }
  ]);
  
  const [dropdowns, setDropdowns] = useState({
    patientName: { show: false, items: [] },
    patientReg: { show: false, items: [] },
    medicines: {}
  });

  const dropdownRefs = useRef({});

  // Handle input changes for form data
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle patient name autocomplete
const handlePatientNameChange = async (e) => {
  const value = e.target.value;
  setFormData(prev => ({ ...prev, patientName: value }));

  if (value.length > 0) {
    try {
      const res = await axios.get(`http://localhost:5000/api/patients/search-regnos?query=${value}`);
      const matches = res.data;

      const nameMatches = matches.filter(p => 
        p.name.toLowerCase().includes(value.toLowerCase())
      );

      setDropdowns(prev => ({
        ...prev,
        patientName: { show: true, items: nameMatches }
      }));

      // ✅ Check if patient with same name exists and toggle Edit
      if (nameMatches.length > 0) {
        setIsExistingPatient(true);
      } else {
        setIsExistingPatient(false);
      }

    } catch (error) {
      console.error("Error fetching patient names:", error);
    }
  } else {
    setDropdowns(prev => ({
      ...prev,
      patientName: { show: false, items: [] }
    }));
    setIsExistingPatient(false);
  }
};


  // Handle patient reg number autocomplete
const handlePatientRegChange = async (e) => {
  const value = e.target.value.toUpperCase();
  setFormData(prev => ({ ...prev, patientRegNo: value }));

  if (value.length > 0) {
    try {
      const res = await axios.get(`http://localhost:5000/api/patients/search-regnos?query=${value}`);
      const matches = res.data; // already formatted like [{ regNo, name, gender }]
      console.log("Reg Matches:", matches);

      setDropdowns(prev => ({
        ...prev,
        patientReg: { show: true, items: matches }
      }));
    } catch (err) {
      console.error("Failed to fetch regnos:", err);
    }
  } else {
    setDropdowns(prev => ({
      ...prev,
      patientReg: { show: false, items: [] }
    }));
  }
};

const [isExistingPatient, setIsExistingPatient] = useState(false); // To toggle Edit button
  // Handle patient selection from dropdown
const handlePatientSelect = (patient) => {
  setFormData(prev => ({
    ...prev,
    patientName: patient.name,
    patientRegNo: patient.regno,
    patientGender: patient.gender,
    patientType: patient.type || '',
    patientStayType: patient.stay_type || '',
    patientAge: patient.age || '',
    patientDepartment: patient.department || '',
    patientMobile: patient.mobile || ''
  }));

  
  setDropdowns(prev => ({
    ...prev,
    patientName: { show: false, items: [] },
    patientReg: { show: false, items: [] }
  }));
  setIsExistingPatient(true);

};

  // Handle medicine name changes
  // Add medicine validation state
const [medicineErrors, setMedicineErrors] = useState({});

// Update handleMedicineNameChange function
const handleMedicineNameChange = (rowId, value) => {
  setMedicineRows(prev => 
    prev.map(row => 
      row.id === rowId ? { ...row, medicineName: value, availableStock: 0 } : row
    )
  );

  // Clear any existing error for this row
  setMedicineErrors(prev => ({ ...prev, [rowId]: false }));

  if (value.length > 0) {
    const matches = medicinesData.filter(m => 
      m.name.toLowerCase().includes(value.toLowerCase())
    );
    
    setDropdowns(prev => ({
      ...prev,
      medicines: {
        ...prev.medicines,
        [rowId]: { show: true, items: matches }
      }
    }));

    // Check if exact match exists
    const exactMatch = medicinesData.find(m => 
      m.name.toLowerCase() === value.toLowerCase()
    );
    
    if (!exactMatch && value.length > 2) {
      setMedicineErrors(prev => ({ ...prev, [rowId]: true }));
    }
  } else {
    setDropdowns(prev => ({
      ...prev,
      medicines: {
        ...prev.medicines,
        [rowId]: { show: false, items: [] }
      }
    }));
  }
};


const handleMedicineSelect = (rowId, medicine) => {
  if (medicine.stock <= 0) {
    alert(`${medicine.name} is out of stock.`);
    return;
  }

  setMedicineRows(prev => prev.map(row => 
    row.id === rowId 
      ? { 
          ...row, 
          medicineName: medicine.name, 
          availableStock: medicine.stock 
        }
      : row
  ));
  setDropdowns(prev => ({
    ...prev,
    medicines: {
      ...prev.medicines,
      [rowId]: { show: false, items: [] }
    }
  }));
};


  // Handle medicine row updates
  const handleMedicineRowChange = (rowId, field, value) => {
    setMedicineRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));
  };

  // Add new medicine row
  const addMedicineRow = () => {
    const newId = Math.max(...medicineRows.map(row => row.id)) + 1;
    setMedicineRows(prev => [...prev, {
      id: newId,
      medicineName: '',
      availableStock: 0,
      quantity: '',
      instructions: ''
    }]);
  };

  // Remove medicine row
  const removeMedicineRow = (rowId) => {
    if (medicineRows.length > 1) {
      setMedicineRows(prev => prev.filter(row => row.id !== rowId));
      setDropdowns(prev => ({
        ...prev,
        medicines: {
          ...prev.medicines,
          [rowId]: undefined
        }
      }));
    } else {
      alert('At least one medicine row is required.');
    }
  };

  // Handle new patient button
const navigate = useNavigate();

const handleNewPatient = () => {
  navigate('/AddPatient'); // This should match your route path
};

  // Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();

  const medicines = medicineRows
    .filter(row => row.medicineName && row.quantity)
    .map(row => ({
      name: row.medicineName,
      quantity: parseInt(row.quantity),
      instructions: row.instructions
    }));

  const submissionData = {
    patientRegNo: formData.patientRegNo,
      patientType: formData.patientType,
     patientStayType: formData.patientStayType,
  patientAge: formData.patientAge,
  patientDepartment: formData.patientDepartment,
  patientMobile: formData.patientMobile,
    patientProblems: formData.patientProblems,
    patientDiagnosis: formData.patientDiagnosis,

    medicines
  };

  console.log("🟡 Submission Data:", submissionData);
  await withLoader(async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/diagnosis', submissionData); // ✅ your backend path is '/'
    alert("✅ Diagnosis submitted successfully");
    navigate('/dashboard');
  } catch (err) {
    console.error("❌ Submit Error:", err);

    if (err.response) {
      console.error("🟥 Backend responded with error:", err.response.data);
      alert(`❌ ${err.response.data.error || 'Submission failed'}`);
    } else if (err.request) {
      console.error("🟠 No response received from backend:", err.request);
      alert("❌ No response from server. Check if server is running.");
    } else {
      console.error("🔴 Request setup error:", err.message);
      alert("❌ Unknown error occurred.");
    }
  }
  });
};


  
  // Handle back button
  const handleBack = () => {
    // You can implement navigation here
    
  navigate('/dashboard'); // This should match your route path

  };


const [medicinesData, setMedicinesData] = useState([]);

useEffect(() => {
  const fetchMedicines = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/medicines');
      setMedicinesData(res.data); // List of { id, name, stock }
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
    }
  };

  fetchMedicines();
}, []);



  // Hide dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      let shouldHide = true;
      
      // Check if click is inside any dropdown container
      Object.keys(dropdownRefs.current).forEach(key => {
        const ref = dropdownRefs.current[key];
        if (ref && ref.contains(event.target)) {
          shouldHide = false;
        }
      });

      if (shouldHide) {
        setDropdowns(prev => ({
          
          patientName: { show: false, items: [] },
          patientReg: { show: false, items: [] },
          medicines: Object.keys(prev.medicines).reduce((acc, key) => {
            acc[key] = { show: false, items: [] };
            return acc;
          }, {})
        }));
      }
    };
    console.log("Dropdown refs:", dropdownRefs.current)


    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className='diagnosis-page'>
    <div className="diagnosis-container">
      <button className="back-btn" onClick={handleBack}>
        ← Back to Dashboard
      </button>
      
      <div className="header">
        <img src={logo} alt="TCE Logo" className="header-logo" />
        <h1>Patient Diagnosis</h1>
        <h3>Thiagarajar College Of Engineering - Dispensary</h3>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Patient Information Section */}
        <div className="form-section">
          <div className="form-row">
            <div 
              className="form-group dropdown-container"
              ref={el => dropdownRefs.current['patientName'] = el}
            >
              <label htmlFor="patientName">Patient Name *</label>
              <input
                type="text"
                id="patientName"
                name="patientName"
                value={formData.patientName}
                onChange={handlePatientNameChange}
                required
                autoComplete="off"
              />
             {isExistingPatient ? (
  <button 
    type="button" 
    className="edit-btn" 
    onClick={() => navigate('/AddPatient', {
      state: {
        edit: true,
        data: {
          name: formData.patientName,
          regno: formData.patientRegNo,
          gender: formData.patientGender
        }
      }
    })}
  >
    Edit
  </button>
) : (
  <button 
    type="button" 
    className="new-btn" 
    onClick={handleNewPatient}
  >
    New
  </button>
)}

<div 
  className={`dropdown-list ${dropdowns.patientName.show ? 'show' : ''}`}
>
  {dropdowns.patientName.items.map(patient => (
    <div
      key={patient.regNo || patient.name} // ✅ Use a unique key
      className="dropdown-item"
      onClick={() => handlePatientSelect(patient)}
    >
      {patient.name}
    </div>
  ))}
</div>

            </div>
            
<div 
  className="form-group dropdown-container"
  ref={el => dropdownRefs.current['patientReg'] = el}
>
  <label htmlFor="patientRegNo">Patient Register Number/Phone number *</label>
  <input
    type="text"
    id="patientRegNo"
    name="patientRegNo"
    value={formData.patientRegNo}
    onChange={handlePatientRegChange}
    required
    autoComplete="off"
  />

  {/* ✅ Show dropdown for patient register numbers */}
  <div 
    className={`dropdown-list ${dropdowns.patientReg.show ? 'show' : ''}`}
  >
    {dropdowns.patientReg.items.map(patient => (
      <div
        key={`${patient.regno}`}
        className="dropdown-item"
        onClick={() => handlePatientSelect(patient)}
      >
        {patient.regno}
      </div>
    ))}
  </div>
</div>

            
            <div className="form-group">
              <label htmlFor="patientGender">Gender *</label>
              <select
                id="patientGender"
                name="patientGender"
                value={formData.patientGender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
        {/* Patient Extra Info Row 1 */}
         <div className="form-section">
<div className="form-row">
  <div className="form-group">
    <label htmlFor="patientType">Type</label>
    <input
      type="text"
      id="patientType"
      name="patientType"
      value={formData.patientType}
      onChange={handleInputChange}
    />
  </div>
  <div className="form-group">
    <label htmlFor="patientStayType">Stay Type</label>
    <input
      type="text"
      id="patientStayType"
      name="patientStayType"
      value={formData.patientStayType}
      onChange={handleInputChange}
    />
  </div>
  <div className="form-group">
    <label htmlFor="patientAge">Age</label>
    <input
      type="number"
      id="patientAge"
      name="patientAge"
      value={formData.patientAge}
      onChange={handleInputChange}
    />
  </div>
</div>
</div>

 <div className="form-section">

{/* Patient Extra Info Row 2 */}
<div className="form-row">
  <div className="form-group">
    <label htmlFor="patientDepartment">Department</label>
    <input
      type="text"
      id="patientDepartment"
      name="patientDepartment"
      value={formData.patientDepartment}
      onChange={handleInputChange}
    />
  </div>
  <div className="form-group">
    <label htmlFor="patientMobile">Mobile No</label>
    <input
      type="text"
      id="patientMobile"
      name="patientMobile"
      value={formData.patientMobile}
      onChange={handleInputChange}
    />
  </div>
</div>
</div>


        {/* Patient Problems Section */}
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="patientProblems">Patient Problems *</label>
            <textarea
              id="patientProblems"
              name="patientProblems"
              className="textarea-large"
              value={formData.patientProblems}
              onChange={handleInputChange}
              required
              placeholder="Describe the patient's symptoms and problems in detail..."
            />
          </div>
        </div>

        {/* Patient Diagnosis Section */}
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="patientDiagnosis">Patient Diagnosis *</label>
            <textarea
              id="patientDiagnosis"
              name="patientDiagnosis"
              className="textarea-large"
              value={formData.patientDiagnosis}
              onChange={handleInputChange}
              required
              placeholder="Enter the medical diagnosis and treatment plan..."
            />
          </div>
        </div>

        {/* Medicine Prescription Section */}
        <div className="form-section">
          <label>Medicine Prescription</label>
          <table className="medicine-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Available Stock</th>
                <th>Quantity Prescribed</th>
                <th>Instructions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {medicineRows.map(row => (
                <tr key={row.id}>
                  <td>
                    <div 
                      style={{ position: 'relative' }}
                      ref={el => dropdownRefs.current[`medicine-${row.id}`] = el}
                    >
                      <input
                        type="text"
                        className="medicine-name"
                        value={row.medicineName}
                        onChange={(e) => handleMedicineNameChange(row.id, e.target.value)}
                        placeholder="Search medicine..."
                        autoComplete="off"
                      />
                      <div 
                        className={`dropdown-list medicine-dropdown ${
                          dropdowns.medicines[row.id]?.show ? 'show' : ''
                        }`}
                      >
                        {(dropdowns.medicines[row.id]?.items || []).map(medicine => (
                          <div
                            key={medicine.id}
                            className="dropdown-item"
                            onClick={() => handleMedicineSelect(row.id, medicine)}
                          >
                            {medicine.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="available-stock">{row.availableStock}</span>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="medicine-quantity"
                      value={row.quantity}
                      onChange={(e) => handleMedicineRowChange(row.id, 'quantity', e.target.value)}
                      min="1"
                      max={row.availableStock}
                      placeholder="Qty"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="medicine-instructions"
                      value={row.instructions}
                      onChange={(e) => handleMedicineRowChange(row.id, 'instructions', e.target.value)}
                      placeholder="e.g., 1-0-1 after meals"
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeMedicineRow(row.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
         <div className='add-btn-container'> 
          <button type="button" className="add-row-btn" onClick={addMedicineRow}>
            + Add Medicine
          </button>
          </div>
        </div>

        <button type="submit" className="submit-btn" onSubmit={handleSubmit}>
          Submit Diagnosis
        </button>
      </form>
    </div>
   </div> 
  );
};

export default PatientDiagnosis;
