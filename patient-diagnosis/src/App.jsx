import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PatientDiagnosis from './components/PatientDiagnosis';
import BillEntry from './components/BillEntry';
import AddPatient from './components/Add_Patient';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import RequirementQuotation from './components/RequirementQuotation'; // Add this import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/PatientDiagnosis" element={<PatientDiagnosis />} />
        <Route path="/BillEntry" element={<BillEntry />} />
        <Route path="/AddPatient" element={<AddPatient />} />
        <Route path="/RequirementQuotation" element={<RequirementQuotation />} /> {/* Add this route */}
      </Routes>
    </Router>
  );
}

export default App;
