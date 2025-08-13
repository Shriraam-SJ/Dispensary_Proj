import React from 'react';


export default function Home() {
  return (
    <div className="home-container" style={{ 
      backgroundImage: "url('/tce-bg.jpg')", 
      backgroundSize: 'cover', 
      height: '100vh',
      color: '#fff',
      textAlign: 'center'
    }}>
      <img src="/tce-logo.png" alt="TCE Logo" style={{ marginTop: '30px', width: '200px' }} />
      <h1>TCE Dispensary</h1>
      <p style={{ fontSize: '1.2rem' }}>Track your medical records and health with ease.</p>
      <div style={{ marginTop: '20px' }}>
        <a href="/register" className="btn">Register</a>
        <a href="/login" className="btn">Login</a>
      </div>
    </div>
  );
}
