import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useUser();
  const { openSignIn } = useClerk();

  const handleLogin = () => {
    openSignIn({
      appearance: {
        elements: {
          phoneNumberField: { display: "none" },
          phoneNumberSection: { display: "none" }
        }
      },
      signInOptions: {
        identifier: {
          strategies: ["email"]
        }
      }
    });
  };

  return (
    <>
      <nav className="navbar-container">

        {/* Logo */}
        <Link to="/" className="nav-logo-link">
          <img src={logo} alt="Logo" className="nav-logo" />
        </Link>

        {/* Desktop Links */}
        <div className="nav-center">
          <ul className="nav-links-list">
            <li><Link to="/" className="nav-link-item">Home</Link></li>
            <li><Link to="/events" className="nav-link-item">Events</Link></li>
            <li><Link to="/my-bookings" className="nav-link-item">My Bookings</Link></li>
            <li><Link to="/contact" className="nav-link-item">Contact</Link></li>
          </ul>
        </div>

        {/* Right */}
        <div className="nav-right">
          {!user ? (
            <button className="login-btn" onClick={handleLogin}>Login</button>
          ) : (
            <UserButton />
          )}

          {/* Hamburger */}
          <div
            className={`menu-icon ${isMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'show' : ''}`}>
        <ul>
          <li><Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
          <li><Link to="/events" onClick={() => setIsMenuOpen(false)}>Events</Link></li>
          <li><Link to="/my-bookings" onClick={() => setIsMenuOpen(false)}>My Bookings</Link></li>
          <li><Link to="/contact" onClick={() => setIsMenuOpen(false)}>Contact</Link></li>
        </ul>
      </div>
    </>
  );
};

export default Navbar;
