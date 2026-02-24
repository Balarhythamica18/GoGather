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
    const updateUser = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const name = localStorage.getItem("name");

      // Only show as logged in for regular users (not admins or organizers)
      // Admins will logout from their dashboard
      if (token && role === "user") {
        setIsLoggedIn(true);
        setUsername(name || "User");
      } else {
        setIsLoggedIn(false);
        setUsername("");
      }
    };

    // Listen for custom login/logout events
    window.addEventListener("storageChange", updateUser);

    // Listen for cross-tab changes in localStorage
    window.addEventListener("storage", updateUser);

    // Run once on mount
    updateUser();

    return () => {
      window.removeEventListener("storageChange", updateUser);
      window.removeEventListener("storage", updateUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setUsername("");

    navigate("/");
  };

  return (
    <>
      <nav className="navbar-container">
        <Link to="/" className="nav-logo-link">
          <img src={logo} alt="Logo" className="nav-logo" />
        </Link>

        <div className="nav-center">
          <ul className="nav-links-list">
            <li><Link to="/" className="nav-link-item">Home</Link></li>
            <li><Link to="/events" className="nav-link-item">Events</Link></li>
            <li><Link to="/my-bookings" className="nav-link-item">My Bookings</Link></li>
            <li><Link to="/contact" className="nav-link-item">Contact</Link></li>
          </ul>
        </div>

        <div className="nav-right">
          {isLoggedIn && <span className="hi-user">Hi {username}</span>}

          {!isLoggedIn ? (
            <button className="login-btn" onClick={() => navigate("/login")}>Login</button>
          ) : (
            <button className="login-btn" onClick={handleLogout}>Logout</button>
          )}

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