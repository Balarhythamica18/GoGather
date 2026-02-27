import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFavorites } from '../../context/FavoritesContext';
import { HeartIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import logo from '../../assets/logo.png';
import ManageAccountModal from '../ManageAccount/ManageAccountModal';
import './Navbar.css';

const Navbar = () => {
  const { favorites } = useFavorites();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    const updateUser = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const name = localStorage.getItem("name");

      if (token && role === "user") {
        setIsLoggedIn(true);
        setUsername(name || "User");
      } else {
        setIsLoggedIn(false);
        setUsername("");
      }
    };

    window.addEventListener("storageChange", updateUser);
    window.addEventListener("storage", updateUser);
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
    window.dispatchEvent(new Event("storageChange")); // Notify other components
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
            {favorites.length > 0 && (
              <li>
                <Link to="/favorites" className="nav-link-item favorites-link">

                  Favorites
                </Link>
              </li>
            )}
            <li><Link to="/contact" className="nav-link-item">Contact</Link></li>

          </ul>
        </div>

        <div className="nav-right">
          {isLoggedIn ? (
            <div className="user-profile-actions">
              <div className="user-info-pill">
                <span className="hi-user">Hi, {username}</span>
                <button
                  className="icon-action-btn account-btn"
                  onClick={() => setIsAccountModalOpen(true)}
                  title="Manage Account"
                >
                  <UserCircleIcon className="nav-icon-sm" />
                </button>
              </div>
              <button className="navbar-logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            !isAuthPage && (
              <button className="login-btn primary-nav-btn" onClick={() => navigate("/login")}>
                Login
              </button>
            )
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
          {favorites.length > 0 && <li><Link to="/favorites" onClick={() => setIsMenuOpen(false)}>Favorites</Link></li>}
          <li><Link to="/contact" onClick={() => setIsMenuOpen(false)}>Contact</Link></li>
          {isLoggedIn && <li><button className="mobile-manage-btn" onClick={() => { setIsAccountModalOpen(true); setIsMenuOpen(false); }}>Manage Account</button></li>}
        </ul>
      </div>

      <ManageAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
