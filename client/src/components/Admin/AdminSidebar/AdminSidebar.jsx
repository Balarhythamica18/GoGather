import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  CheckCircle,
  LogOut,
  ShieldCheck,
} from "lucide-react";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const adminName = localStorage.getItem("name") || "Admin";
  const [pendingCount, setPendingCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener("toggleAdminSidebar", handleToggle);
    return () => window.removeEventListener("toggleAdminSidebar", handleToggle);
  }, []);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/admin/events/pending-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPendingCount(res.data.count);
      } catch (err) {
        console.error("Error fetching pending count:", err);
      }
    };

    fetchPendingCount();

    const socket = io("http://localhost:5000");
    socket.on("pendingCountUpdate", ({ count }) => {
      setPendingCount(count);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { id: "users", icon: Users, label: "Users", path: "/admin/users" },
    { id: "shows", icon: Calendar, label: "List Shows", path: "/admin/list-shows" },
    { id: "bookings", icon: ClipboardList, label: "List Bookings", path: "/admin/list-bookings" },
    { id: "approvals", icon: CheckCircle, label: "Event Approvals", path: "/admin/event-approvals" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storageChange"));
    navigate("/login");
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
        onClick={() => setIsOpen(false)}
        style={styles.overlay}
      />
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`} style={styles.sidebar}>
        <style>{`
          @media (max-width: 768px) {
            .admin-sidebar {
              transform: translateX(-100%);
              transition: transform 0.3s ease-in-out;
            }
            .admin-sidebar.open {
              transform: translateX(0);
            }
            .sidebar-overlay {
              display: none;
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.4);
              backdrop-filter: blur(2px);
              z-index: 999;
            }
            .sidebar-overlay.show {
              display: block;
            }
            .mobile-close-btn {
              display: flex !important;
            }
          }
        `}</style>

        <button
          className="mobile-close-btn"
          onClick={() => setIsOpen(false)}
          style={styles.closeBtn}
        >
          ✕
        </button>

        <div style={styles.logo}>
          <div style={styles.logoIcon}><ShieldCheck size={20} /></div>
          <span style={styles.logoText}>GoGather Admin</span>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={index}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false); // Close on navigation
                }}
                style={{
                  ...styles.navItem,
                  backgroundColor: isActive ? "#fff0f6" : "transparent",
                  color: isActive ? "#ff007a" : "#64748b",
                }}
              >
                <item.icon size={20} color={isActive ? "#ff007a" : "#64748b"} />
                <span style={styles.navLabel}>{item.label}</span>
                {item.id === "approvals" && pendingCount > 0 && (
                  <div style={styles.badge}>{pendingCount}</div>
                )}
                {isActive && <div style={styles.activeIndicator} />}
              </button>
            );
          })}
        </nav>

        <div style={styles.footer}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {adminName.charAt(0)}
            </div>
            <div style={styles.userDetails}>
              <p style={styles.userName}>{adminName}</p>
              <p style={styles.userRole}>System Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

const styles = {
  sidebar: {
    width: "260px",
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    backgroundColor: "#fff",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    padding: "32px 16px",
    zIndex: 1000,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 12px 32px 12px",
    borderBottom: "1px solid #f1f5f9",
    marginBottom: "32px",
  },
  logoIcon: {
    width: "32px",
    height: "32px",
    backgroundColor: "#ff007a",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  logoText: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: "-0.02em",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    position: "relative",
    textAlign: "left",
    width: "100%",
  },
  navLabel: {
    flex: 1,
  },
  activeIndicator: {
    position: "absolute",
    right: "0",
    width: "4px",
    height: "20px",
    backgroundColor: "#ff007a",
    borderRadius: "4px 0 0 4px",
  },
  badge: {
    backgroundColor: "#ff007a",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "800",
    padding: "2px 6px",
    borderRadius: "20px",
    marginLeft: "8px",
    minWidth: "18px",
    textAlign: "center",
  },
  footer: {
    marginTop: "auto",
    paddingTop: "24px",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 12px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    backgroundColor: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    color: "#64748b",
    fontSize: "18px",
  },
  userDetails: {
    display: "flex",
    flexDirection: "column",
  },
  userName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  userRole: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: 0,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "transparent",
    color: "#f43f5e",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    width: "100%",
    textAlign: "left",
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: '#f1f5f9',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'none', // Shown via media query
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: '#64748b',
    cursor: 'pointer',
    zIndex: 10,
  },
  overlay: {
    // Basic properties handled by media query
  }
};

export default AdminSidebar;
