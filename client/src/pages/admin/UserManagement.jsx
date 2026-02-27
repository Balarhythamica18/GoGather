import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, AlertTriangle, X, Activity } from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config";
import "./Admin.css";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [impactData, setImpactData] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loadingImpact, setLoadingImpact] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [filters, setFilters] = useState({
        q: "",
        role: "all",
        date: ""
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    ...filters,
                    page,
                    limit: 10
                }
            });
            setUsers(res.data.users || []);
            setTotalPages(res.data.totalPages || 1);
            setTotalEntries(res.data.totalEntries || 0);
        } catch (error) {
            console.error("Error fetching users:", error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to load users";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [filters, page]);

    const handleDeleteClick = async (user) => {
        setSelectedUser(user);
        setShowModal(true);
        setLoadingImpact(true);
        setImpactData(null);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_BASE_URL}/api/admin/users/${user._id}/info`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setImpactData(res.data);
        } catch (error) {
            console.error("Error fetching impact data:", error);
            toast.error("Failed to load user impact data");
        } finally {
            setLoadingImpact(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedUser) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_BASE_URL}/api/admin/users/${selectedUser._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(users.filter(u => u._id !== selectedUser._id));
            toast.success("User deleted successfully");
            setShowModal(false);
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="admin-users">
            <h1 className="admin-dashboard__title">User Management</h1>
            <p className="admin-dashboard__subtitle">View, monitor, and manage all registered system users.</p>

            <div className="admin-filters-bar" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: '200px' }}>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={filters.q}
                        onChange={(e) => { setFilters({ ...filters, q: e.target.value }); setPage(1); }}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                    />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <select
                        value={filters.role}
                        onChange={(e) => { setFilters({ ...filters, role: e.target.value }); setPage(1); }}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#fff' }}
                    >
                        <option value="all">All Roles</option>
                        <option value="user">Users</option>
                        <option value="organizer">Organizers</option>
                        <option value="admin">Administrators</option>
                    </select>
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => { setFilters({ ...filters, date: e.target.value }); setPage(1); }}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                        title="Filter by Joined Date"
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <Activity className="animate-spin" style={{ margin: '0 auto 16px auto' }} />
                    <p>Fetching members...</p>
                </div>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Account Name</th>
                                <th>Email Address</th>
                                <th>Security Role</th>
                                <th>Joined Date</th>
                                <th style={{ textAlign: 'right' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        No users found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id}>
                                        <td style={{ fontWeight: '700' }}>{user.name}</td>
                                        <td style={{ color: '#64748b' }}>{user.email}</td>
                                        <td>
                                            <span className={`role-badge role-${user.role}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ color: '#94a3b8' }}>{new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteClick(user)}
                                                style={{ marginLeft: 'auto' }}
                                                title="Delete Account"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="admin-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '0 8px' }}>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>
                                Showing <strong>{(page - 1) * 10 + 1}</strong> to <strong>{Math.min(page * 10, totalEntries)}</strong> of <strong>{totalEntries}</strong> members
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        background: '#fff',
                                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                                        opacity: page === 1 ? 0.5 : 1,
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        color: '#475569'
                                    }}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        background: '#fff',
                                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                        opacity: page === totalPages ? 0.5 : 1,
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        color: '#475569'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {showModal && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content" style={{ animation: 'slideUp 0.3s ease-out' }}>
                        <div className="admin-modal-header">
                            <div className="admin-modal-icon warning">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Terminate Account</h3>
                                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>This action cannot be undone.</p>
                            </div>
                            <button
                                className="close-btn"
                                onClick={() => setShowModal(false)}
                                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="admin-modal-body">
                            <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6' }}>
                                Are you sure you want to remove <strong>{selectedUser?.name}</strong> from the system?
                            </p>

                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', marginTop: '20px' }}>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.05em' }}>
                                    Impact Analysis
                                </div>
                                {loadingImpact ? (
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>Scanning database for dependencies...</div>
                                ) : impactData ? (
                                    <div style={{ fontSize: '14px', color: '#475569' }}>
                                        {selectedUser?.role === "organizer" ? (
                                            <p style={{ margin: 0 }}>⚠️ Removing this organizer will also purge <strong>{impactData.events?.length || 0}</strong> active events.</p>
                                        ) : (
                                            <p style={{ margin: 0 }}>⚠️ Removing this user will delete <strong>{impactData.bookings?.length || 0}</strong> confirmed bookings.</p>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="admin-modal-footer">
                            <button
                                className="modal-btn cancel"
                                onClick={() => setShowModal(false)}
                                disabled={isDeleting}
                            >
                                Keep Account
                            </button>
                            <button
                                className="modal-btn delete"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                style={{ backgroundColor: '#f43f5e', boxShadow: '0 4px 12px rgba(244, 63, 94, 0.2)' }}
                            >
                                {isDeleting ? "Terminating..." : "Confirm Deletion"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default UserManagement;
