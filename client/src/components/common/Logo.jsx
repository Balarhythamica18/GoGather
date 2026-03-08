import React from 'react';
import './Logo.css';

const Logo = ({ className = '', showText = true, variant = 'dark' }) => {
  return (
    <div className={`app-logo ${variant} ${className}`}>
      <div className="logo-icon-box">G</div>
      {showText && <span className="logo-text">GoGather</span>}
    </div>
  );
};

export default Logo;
