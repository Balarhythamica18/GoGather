import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, AlertTriangle, X } from "lucide-react";
import toast from "react-hot-toast";
import "./Admin.css";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [impactData, setImpactData] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loadingImpact, setLoadingImpact] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/admin/users", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUsers(res.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleDeleteClick = async (user) => {
        setSelectedUser(user);
        setShowModal(true);
        setLoadingImpact(true);
        setImpactData(null);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`/api/admin/users/${user._id}/info`, {
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
            await axios.delete(`/api/admin/users/${selectedUser._id}`, {
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
            <p className="admin-dashboard__subtitle">View and manage system users</p>

            {loading ? (
                <p>Loading users...</p>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge role-${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeleteClick(user)}
                                            title="Delete User"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Confirmation Modal */}
            {showModal && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content">
                        <div className="admin-modal-header">
                            <div className="admin-modal-icon warning">
                                <AlertTriangle size={24} />
                            </div>
                            <h3>Confirm Deletion</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="admin-modal-body">
                            <p>Are you sure you want to delete <strong>{selectedUser?.name}</strong>?</p>
                            <p className="role-warning">Role: <span className={`role-badge role-${selectedUser?.role}`}>{selectedUser?.role}</span></p>

                            {loadingImpact ? (
                                <div className="impact-loading">Calculating impact...</div>
                            ) : impactData ? (
                                <div className="impact-container">
                                    {selectedUser?.role === "organizer" ? (
                                        <>
                                            <p className="impact-warning">⚠️ This will also delete <strong>{impactData.events?.length || 0}</strong> events hosted by them.</p>
                                            {impactData.events?.length > 0 && (
                                                <ul className="impact-list">
                                                    {impactData.events.map(e => <li key={e._id}>{e.title}</li>)}
                                                </ul>
                                            )}
                                        </>
                                    ) : (
                                        <p className="impact-warning">⚠️ This will delete <strong>{impactData.bookings?.length || 0}</strong> bookings made by this user.</p>
                                    )}
                                </div>
                            ) : null}

                            <p className="confirm-text">This action is permanent and cannot be undone.</p>
                        </div>

                        <div className="admin-modal-footer">
                            <button
                                className="modal-btn cancel"
                                onClick={() => setShowModal(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-btn delete"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Yes, Delete Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
