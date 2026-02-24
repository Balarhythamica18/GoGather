import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
    <aside style={styles.sidebar}>
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
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navItem,
                backgroundColor: isActive ? "#fff0f6" : "transparent",
                color: isActive ? "#ff007a" : "#64748b",
              }}
            >
              <item.icon size={20} color={isActive ? "#ff007a" : "#64748b"} />
              <span style={styles.navLabel}>{item.label}</span>
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
};

export default AdminSidebar;
