import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Users,
    UserCheck,
    Calendar,
    ClipboardList,
    DollarSign,
    TrendingUp,
    Activity
} from "lucide-react";
import StatCard from "../../components/organizer/StatCard";

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:5000/api/admin/stats", {
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
                console.error("Error fetching admin stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div style={styles.container}>
            <style>{`
                @media (max-width: 600px) {
                    .responsive-stats-grid, .responsive-content-grid {
                        display: flex !important;
                        overflow-x: auto !important;
                        gap: 16px !important;
                        padding-bottom: 12px;
                        margin-bottom: 24px;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: thin;
                        padding-left: 4px;
                        padding-right: 4px;
                    }
                    .responsive-stats-grid > div, .responsive-content-grid > div {
                        flex: 0 0 280px !important;
                        min-width: 280px !important;
                    }
                }
            `}</style>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>System Overview</h1>
                    <p style={styles.subtitle}>Real-time monitoring of GoGather platform activity.</p>
                </div>
                <div style={styles.liveIndicator}>
                    <Activity size={16} color="#10b981" />
                    <span style={styles.liveText}>Live System Status</span>
                </div>
            </header>

            <div style={styles.statsGrid} className="responsive-stats-grid">
                <StatCard
                    title="Total Platform Users"
                    value={stats.users}
                    icon={Users}
                    color="#ff007a"
                />
                <StatCard
                    title="Active Events"
                    value={stats.events}
                    icon={Calendar}
                    color="#ff007a"
                />
                <StatCard
                    title="Platform Bookings"
                    value={stats.bookings}
                    icon={ClipboardList}
                    color="#ff007a"
                />
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.revenue.toLocaleString()}`}
                    icon={DollarSign}
                    color="#ff007a"
                />
            </div>

            <div style={styles.contentGrid} className="responsive-content-grid">
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>User Distribution</h3>
                    <div style={styles.userStats}>
                        <div style={styles.userStatItem}>
                            <span style={styles.label}>Organizers</span>
                            <span style={styles.valueText}>{stats.organizers}</span>
                        </div>
                        <div style={styles.userStatItem}>
                            <span style={styles.label}>Customers</span>
                            <span style={styles.valueText}>{stats.customers}</span>
                        </div>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Online Status</h3>
                    <div style={styles.userStats}>
                        <div style={styles.userStatItem}>
                            <span style={styles.label}>Total Online</span>
                            <span style={{ ...styles.valueText, color: '#10b981' }}>{stats.online?.total || 0}</span>
                        </div>
                        <div style={styles.userStatItem}>
                            <span style={styles.label}>Active Organizers</span>
                            <span style={styles.valueText}>{stats.online?.organizers || 0}</span>
                        </div>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Booking Conversion</h3>
                    <div style={styles.userStats}>
                        <div style={styles.userStatItem}>
                            <span style={styles.label}>Confirmed</span>
                            <span style={{ ...styles.valueText, color: '#ff007a' }}>{stats.confirmedBookings}</span>
                        </div>
                        <div style={styles.userStatItem}>
                            <span style={styles.label}>Success Rate</span>
                            <span style={styles.valueText}>
                                {stats.bookings > 0 ? ((stats.confirmedBookings / stats.bookings) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        animation: 'fadeIn 0.5s ease-out',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
    },
    title: {
        fontSize: '28px',
        fontWeight: '800',
        color: '#1e293b',
        margin: '0 0 8px 0',
        letterSpacing: '-0.02em',
    },
    subtitle: {
        fontSize: '16px',
        color: '#64748b',
        margin: 0,
    },
    liveIndicator: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: '#f0fdf4',
        borderRadius: '20px',
        border: '1px solid #dcfce7',
    },
    liveText: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#166534',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '40px',
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        border: '1px solid #f1f5f9',
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1e293b',
        margin: '0 0 20px 0',
    },
    userStats: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    userStatItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: '15px',
        color: '#64748b',
        fontWeight: '500',
    },
    valueText: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#1e293b',
    },
};

export default AdminDashboard;
