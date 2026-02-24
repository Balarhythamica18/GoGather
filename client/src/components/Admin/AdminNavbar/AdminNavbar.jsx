import React from "react";
import "./AdminNavbar.css";

const AdminNavbar = () => {
  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <span style={styles.welcome}>
          Admin Control Center
        </span>
      </div>
      <div style={styles.right}>
        <div style={styles.badge}>System Active</div>
      </div>
    </header>
  );
};

const styles = {
  header: {
    height: "64px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 40px",
    position: "fixed",
    top: 0,
    left: "260px",
    right: 0,
    zIndex: 100,
  },
  left: {
    display: "flex",
    alignItems: "center",
  },
  welcome: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  badge: {
    padding: "4px 12px",
    borderRadius: "20px",
    backgroundColor: "#ecfdf5",
    color: "#059669",
    fontSize: "12px",
    fontWeight: "700",
  },
};

export default AdminNavbar;
