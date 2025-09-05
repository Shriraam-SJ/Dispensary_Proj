import React from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'framer-motion';

const Toast = ({ message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClose}
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '2rem',
        zIndex: 3000,
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '14px',
        maxWidth: '350px',
      }}
    >
      <span style={{ fontSize: '16px' }}>✅</span>
      <span>{message}</span>
    </motion.div>
  );
};

export function showReportSuccess(reportName) {
  const toastElement = document.createElement('div');
  document.body.appendChild(toastElement);
  
  const root = createRoot(toastElement);
  
  const closeToast = () => {
    root.unmount();
    document.body.removeChild(toastElement);
  };

  root.render(<Toast message={`${reportName} report generated successfully!`} onClose={closeToast} />);
}
