import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Admin.css";

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        users: 0,
        organizers: 0,
        customers: 0,
        online: { total: 0, organizers: 0, customers: 0 },
        events: 0,
        bookings: 0,
        confirmedBookings: 0,
        revenue: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/admin/stats", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStats({
                    users: res.data.users.total,
                    organizers: res.data.users.organizers,
                    customers: res.data.users.customers,
                    online: res.data.users.online,
                    events: res.data.events,
                    bookings: res.data.bookings.total,
                    confirmedBookings: res.data.bookings.confirmed,
                    revenue: res.data.revenue,
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="admin-dashboard">
            <h1 className="admin-dashboard__title">Admin Dashboard</h1>
            <p className="admin-dashboard__subtitle">System Overview & Statistics</p>

            <div className="admin-dashboard__stats-grid">
                <div className="admin-dashboard__stat-card">
                    <h3>Total Users</h3>
                    <p className="admin-dashboard__stat-value">{stats.users}</p>
                    <div className="admin-dashboard__stat-sub">
                        <span>{stats.organizers} Organizers</span>
                        <span>{stats.customers} Customers</span>
                    </div>
                </div>
                <div className="admin-dashboard__stat-card admin-dashboard__stat-card--online">
                    <h3>Currently Online</h3>
                    <p className="admin-dashboard__stat-value">{stats.online?.total || 0}</p>
                    <div className="admin-dashboard__stat-sub">
                        <span>{stats.online?.organizers || 0} Organizers</span>
                        <span>{stats.online?.customers || 0} Customers</span>
                    </div>
                </div>
                <div className="admin-dashboard__stat-card">
                    <h3>Active Events</h3>
                    <p className="admin-dashboard__stat-value">{stats.events}</p>
                </div>
                <div className="admin-dashboard__stat-card">
                    <h3>Total Bookings</h3>
                    <p className="admin-dashboard__stat-value">{stats.bookings}</p>
                    <div className="admin-dashboard__stat-sub">
                        <span>{stats.confirmedBookings} Confirmed ✅</span>
                        <span>{stats.bookings - stats.confirmedBookings} Pending ⏳</span>
                    </div>
                </div>
                <div className="admin-dashboard__stat-card admin-dashboard__stat-card--revenue">
                    <h3>Total Revenue</h3>
                    <p className="admin-dashboard__stat-value">₹{stats.revenue.toLocaleString()}</p>
                </div>
            </div>

            <div className="admin-dashboard__recent">
                <h2>System Activity</h2>
                <div className="admin-dashboard__placeholder">
                    <p>Recent activity logs will appear here...</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
