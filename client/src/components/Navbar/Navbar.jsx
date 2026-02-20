import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    if (token && role !== "organizer") {
      setIsLoggedIn(true);
      setUsername(name ? name : "User");
    } else {
      setIsLoggedIn(false);
      setUsername("");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");

    setIsLoggedIn(false);
    setUsername("");

    navigate("/");
    window.location.reload();
  };

  return (
    <>
      <nav className="navbar-container">

        {/* Logo */}
        <Link to="/" className="nav-logo-link">
          <img src={logo} alt="Logo" className="nav-logo" />
        </Link>

        {/* Center Links */}
        <div className="nav-center">
          <ul className="nav-links-list">
            <li><Link to="/" className="nav-link-item">Home</Link></li>
            <li><Link to="/events" className="nav-link-item">Events</Link></li>
            <li><Link to="/my-bookings" className="nav-link-item">My Bookings</Link></li>
            <li><Link to="/contact" className="nav-link-item">Contact</Link></li>
          </ul>
        </div>

        {/* Right Section */}
        <div className="nav-right">

          {/* Hi username */}
          {isLoggedIn && (
            <span className="hi-user">Hi {username}</span>
          )}

          {/* Login / Logout button */}
          {!isLoggedIn ? (
            <button
              className="login-btn"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          ) : (
            <button
              className="login-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
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
