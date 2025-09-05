// src/providers/LoaderProvider.jsx
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const LoaderContext = createContext(null);
export const useLoader = () => useContext(LoaderContext);

export default function LoaderProvider({ children }) {
  const [count, setCount] = useState(0); // supports nested/parallel loads
  const show = useCallback(() => setCount(c => c + 1), []);
  const hide = useCallback(() => setCount(c => Math.max(0, c - 1)), []);
  const isLoading = count > 0;

  // Optional helper to wrap async functions
  const withLoader = useCallback(async (fn) => {
    show();
    try { return await fn(); }
    finally { hide(); }
  }, [show, hide]);

  const value = useMemo(() => ({ show, hide, withLoader, isLoading }), [show, hide, withLoader, isLoading]);

  return (
    <LoaderContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {isLoading && <ScreenLoader />}
      </AnimatePresence>
    </LoaderContext.Provider>
  );
}

function ScreenLoader() {
  return (
    <motion.div
      aria-live="polite"
      aria-relevant="additions text"
      aria-atomic="false"
      role="status"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        backdropFilter: 'blur(2px)',
        background: 'rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ display: 'grid', gap: 10, justifyItems: 'center' }}
      >
        <DualRing />
        <span style={{ color: '#1f6fb2', fontWeight: 600 }}>Loading…</span>
      </motion.div>
    </motion.div>
  );
}

function DualRing() {
  const size = 56;
  const ring = {
    width: size, height: size, borderRadius: '50%',
    border: '4px solid transparent', position: 'absolute'
  };
  return (
    <div style={{ width: size, height: size, position: 'relative' }} aria-valuetext="loading">
      <motion.span
        style={{ ...ring, borderTopColor: '#2b8bd8', borderLeftColor: '#2b8bd8' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />
      <motion.span
        style={{ ...ring, borderBottomColor: '#7fc0ff', borderRightColor: '#7fc0ff' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
