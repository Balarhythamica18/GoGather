import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import "./AdminNavbar.css";

const AdminNavbar = () => {
  const navigate = useNavigate();
  const adminName = localStorage.getItem("name") || "Admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storageChange"));
    navigate("/login");
  };

  return (
    <header className="admin-navbar">
      <div className="admin-navbar__left">
        <span className="admin-navbar__welcome">Welcome back, <strong>{adminName}</strong></span>
      </div>
      <div className="admin-navbar__right">
        <button className="admin-navbar__logout" onClick={handleLogout}>
          <ArrowLeftOnRectangleIcon className="admin-navbar__icon" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AdminNavbar;
