import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSidebar/AdminSidebar";
import AdminNavbar from "../../components/Admin/AdminNavbar/AdminNavbar";

const Layout = () => {
  return (
    <>
      <style>{`
        .admin-layout {
          min-height: 100vh;
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
        }

        .admin-layout__body {
          display: flex;
          flex: 1;
          margin-top: 64px;
          position: relative;
        }

        .admin-layout__content {
          flex: 1;
          margin-left: 260px;
          padding: 20px 40px 40px;
          min-height: calc(100vh - 64px);
          overflow-y: auto;
          box-sizing: border-box;
          transition: all 0.3s ease;
        }

        @media (max-width: 1024px) {
          .admin-layout__content {
            padding: 32px;
          }
        }

        @media (max-width: 768px) {
          .admin-layout__content {
            margin-left: 0;
            padding: 24px 16px;
          }
        }
      `}</style>

      <div className="admin-layout">
        <AdminSidebar />
        <AdminNavbar />
        <div className="admin-layout__body">
          <main className="admin-layout__content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default Layout;
