import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/login.css";
import logo from "../assets/tce-logo.png";
import {useLoader} from "../providers/LoaderProvider";

const Login = () => {
  const { withLoader } = useLoader();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Wrap the async operation with withLoader
    await withLoader(async () => {
      try {
        const res = await fetch("https://dispensary-proj.onrender.com/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await res.json();
        
        if (res.ok) {
          setMessage(`✅ ${data.message}`);
          setTimeout(() => navigate("/dashboard"), 1500);
        } else {
          setMessage(`❌ ${data.error || data.message}`);
        }
      } catch (err) {
        console.error(err);
        setMessage("❌ Server error");
      }
    });
  };


      

  return (
    <div className="login-page-wrapper">
      <div className="login-page">
        <div className="form-container">
          <div className="header">
            <img src={logo} alt="TCE Logo" width="100px" />
          </div>
          <h2>Login - TCE Dispensary</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Mail-ID:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />

            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />

            <button type="submit">Login</button>
          </form>
          <p>
            Not yet registered? <Link to="/register">Register</Link>
          </p>
          <div
            className="message"
            style={{ color: message.includes("✅") ? "green" : "red" }}
          >
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
