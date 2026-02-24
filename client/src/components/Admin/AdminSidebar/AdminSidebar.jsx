import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  PlusCircleIcon,
  ListBulletIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import userImage from "../../../../src/assets/user.png";
import "./AdminSidebar.css";

const AdminSidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const adminUser = {
    firstName: "Admin",
    lastName: "User",
  };

  const adminNavLinks = [
    { name: "Dashboard", path: "/admin", icon: HomeIcon },
    { name: "Users", path: "/admin/users", icon: PlusCircleIcon }, // Reusing Plus icon or similar
    { name: "List Shows", path: "/admin/list-shows", icon: ListBulletIcon },
    {
      name: "List Bookings",
      path: "/admin/list-bookings",
      icon: ClipboardDocumentListIcon,
    },
    {
      name: "Event Approvals",
      path: "/admin/event-approvals",
      icon: PlusCircleIcon, // Using Plus icon for now, could be CheckBadgeIcon if available
    },
  ];

  return (
    <>
      {/* HAMBURGER BUTTON (Mobile) */}
      <button
        className="admin-sidebar__hamburger"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <XMarkIcon /> : <Bars3Icon />}
      </button>

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
        {/* ADMIN INFO */}
        <div className="admin-sidebar__info">
          <img
            src={userImage}
            alt="Admin User"
            className="admin-sidebar__user-image"
          />
          <h2>
            {adminUser.firstName} {adminUser.lastName}
          </h2>
        </div>

        {/* NAV LINKS */}
        <nav className="admin-sidebar__nav">
          {adminNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;

            return (
              <Link
                key={link.name}
                to={link.path}
                className={`admin-sidebar__link ${isActive ? "active" : ""
                  }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="admin-sidebar__icon" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* BACKDROP */}
      {isOpen && (
        <div
          className="admin-sidebar__backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AdminSidebar;
