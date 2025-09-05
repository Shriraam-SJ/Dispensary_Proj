import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import bgImage from './assets/tce-bg.jpg';
import grad from './assets/gradient-overlay.png';
import PatientDiagnosis from './components/PatientDiagnosis';
import BillEntry from './components/BillEntry';
import AddPatient from './components/Add_Patient';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import RequirementQuotation from './components/RequirementQuotation';
import SplashScreen from './components/SplashScreen';
import LoaderProvider from './providers/LoaderProvider'; 
import MedicineManagement from './components/MedicineManagement';
import { ToastContainer } from 'react-toastify'; // ✅ Add this import
import 'react-toastify/dist/ReactToastify.css'; // ✅ Add this import
function AnimatedBackground() {
  return (
    <>
      {/* Background Image */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -9999,
          backgroundImage: `url(${bgImage})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
        }}
      />
      {/* PNG Gradient Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -9998,
          backgroundImage: `url(${grad})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          pointerEvents: 'none',
          opacity: 0.3, // Adjust overlay strength
          transition: 'opacity 1s ease-in-out', // Optional fade effect
        }}
      />
    </>
  );
}
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
        <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/PatientDiagnosis" element={<PageWrapper><PatientDiagnosis /></PageWrapper>} />
        <Route path="/BillEntry" element={<PageWrapper><BillEntry /></PageWrapper>} />
        <Route path="/AddPatient" element={<PageWrapper><AddPatient /></PageWrapper>} />
        <Route path="/RequirementQuotation" element={<PageWrapper><RequirementQuotation /></PageWrapper>} />
        <Route path="/MedicineManagement" element={<PageWrapper><MedicineManagement /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

// Motion wrapper component that adds fade & slide animation to page transitions
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      style={{ minHeight: "100vh" }} // Ensures consistent height during transition
    >
      {children}
    </motion.div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onEnd={() => setShowSplash(false)} />;
  }

  return (
    <>
      <AnimatedBackground />
      <Router>
        <AnimatePresence exitBeforeEnter> 
          <LoaderProvider>
          <AnimatedRoutes />
        </LoaderProvider>
        </AnimatePresence>
      </Router>
      <ToastContainer
        position="bottom-left"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;
