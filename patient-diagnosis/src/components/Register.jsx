import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/register.css';
import logo from '../assets/tce-logo.png';
import { useLoader } from '../providers/LoaderProvider';
const Register = () => {
  const { withLoader } = useLoader();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agree: false
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.agree) {
      setMessage('❌ Please agree to the terms.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('❌ Passwords do not match.');
      return;
    }
// ✅ Wrap the async operation with withLoader
    await withLoader(async () => {
      try {
        const res = await fetch("http://localhost:5000/api/register", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
          })
        });

        const data = await res.json();
        
        if (res.ok) {
          setMessage(`✅ ${data.message}`);
          setTimeout(() => navigate('/'), 1500);
        } else {
          const errorMessage = data.error || data.message || 'An unknown error occurred.';
          setMessage(`❌ ${errorMessage}`);
        }
      } catch (err) {
        console.error(err);
        setMessage('❌ Server error');
      }
    });
  };

  return (
    <div className="register-page-wrapper">
      <div className="register-page">
        <div className="form-container">
          <div className='header'>
            <img src={logo} alt="TCE Logo" width='100px' />
          </div>
          <h2>Register - TCE Dispensary</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Full-Name:</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Full Name" required />
            <label htmlFor="email">Mail-ID:</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" required />
            <label htmlFor="phone">Phone Number:</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number" required />
            <label htmlFor="password">Enter Password:</label>
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" required />
            <label htmlFor="confirmPassword">Re-enter Password:</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirm Password" required />

            <div className="checkbox-container">
              <input type="checkbox" id="agree" name="agree" checked={formData.agree} onChange={handleInputChange} />
              <label htmlFor="agree">I agree to the Terms & Conditions</label>
            </div>

            <button type="submit">Register</button>
          </form>
          <p>Already registered? <Link to="/login">Login</Link></p>
          <div className="message" style={{ color: message.includes('✅') ? 'green' : 'red' }}>
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
