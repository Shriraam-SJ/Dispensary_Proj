import React, { useEffect } from 'react';
import logo from '../assets/tce-logo.png';
import '../styles/SplashScreen.css';

const SplashScreen = ({ onEnd }) => {
  useEffect(() => {
    const timer = setTimeout(onEnd, 2100);
    return () => clearTimeout(timer);
  }, [onEnd]);

  return (
    <div className="splash-outer">
      <div className="splash-curtain"></div>
      <div className="splash-bg">
        <div className="splash-content">
          <img src={logo} alt="TCE Logo" className="splash-logo-animate" />
          <div className="splash-titlewrap">
            <h1 className="splash-title-animate">
              TCE Dispensary Management
            </h1>
            <p className="splash-tag-animate">
              Digital Health. Real Care.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
