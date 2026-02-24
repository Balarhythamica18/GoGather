import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Mail, Lock, User, Eye, EyeOff, Trash2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./ManageAccountModal.css";

const ManageAccountModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false });
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState("");
    const [form, setForm] = useState({
        name: "",
        email: "",
        currentPassword: "",
        newPassword: "",
    });

    useEffect(() => {
        if (isOpen) {
            const userData = JSON.parse(localStorage.getItem("user") || "{}");
            setForm({
                name: userData.name || "",
                email: userData.email || "",
                currentPassword: "",
                newPassword: "",
            });
            setIsDeleting(false);
            setConfirmEmail("");
        }
    }, [isOpen]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const togglePassword = (type) => {
        setShowPasswords(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.put("/api/auth/update-profile", {
                name: form.name,
                email: form.email,
                password: form.newPassword || undefined,
                currentPassword: form.newPassword ? form.currentPassword : undefined
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            localStorage.setItem("user", JSON.stringify(res.data.user));
            localStorage.setItem("name", res.data.user.name);
            window.dispatchEvent(new Event("storageChange"));

            toast.success("Account updated successfully!");
            onClose();
        } catch (error) {
            console.error("Update error:", error);
            toast.error(error.response?.data?.message || "Failed to update account");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        if (confirmEmail !== userData.email) {
            toast.error("Email does not match!");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.delete("/api/auth/delete-account", {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Cleanup
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("name");
            localStorage.removeItem("user");
            window.dispatchEvent(new Event("storageChange"));

            toast.success("Account deleted permanently. We're sad to see you go.");
            onClose();
            navigate("/");
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(error.response?.data?.message || "Failed to delete account");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="account-modal-overlay">
            <div className="account-modal-content">
                <div className="account-modal-header">
                    <h2>{isDeleting ? "Delete Account" : "Manage Account"}</h2>
                    <button className="close-icon-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {!isDeleting ? (
                    <form onSubmit={handleSubmit} className="account-modal-form">
                        <div className="account-input-group">
                            <label><User size={16} /> Name</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Your Name"
                                required
                            />
                        </div>

                        <div className="account-input-group">
                            <label><Mail size={16} /> Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Email"
                                required
                            />
                        </div>

                        <div className="password-divider">
                            <span>Change Password (Optional)</span>
                        </div>

                        <div className="account-input-group">
                            <label><Lock size={16} /> Current Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPasswords.current ? "text" : "password"}
                                    name="currentPassword"
                                    value={form.currentPassword}
                                    onChange={handleChange}
                                    placeholder="Required to change password"
                                />
                                <button
                                    type="button"
                                    className="eye-toggle"
                                    onClick={() => togglePassword("current")}
                                >
                                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="account-input-group">
                            <label><Lock size={16} /> New Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPasswords.new ? "text" : "password"}
                                    name="newPassword"
                                    value={form.newPassword}
                                    onChange={handleChange}
                                    placeholder="Leave blank to keep current"
                                />
                                <button
                                    type="button"
                                    className="eye-toggle"
                                    onClick={() => togglePassword("new")}
                                >
                                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="gg-account-danger-zone">
                            <div className="gg-section-divider"></div>
                            <button
                                type="button"
                                className="gg-account-terminate-btn"
                                onClick={() => setIsDeleting(true)}
                            >
                                <Trash2 size={16} /> Delete My Account Permanently
                            </button>
                        </div>

                        <div className="account-modal-footer">
                            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="gg-deletion-flow-container">
                        <div className="gg-deletion-alert-box">
                            <div className="gg-alert-icon-wrapper">
                                <AlertTriangle size={32} />
                            </div>
                            <div className="gg-alert-content">
                                <h3>Account Termination</h3>
                                <p>This action is irreversible. All your bookings, event history, and profile data will be permanently wiped from GoGather.</p>
                            </div>
                        </div>

                        <div className="gg-deletion-input-group">
                            <label>To proceed, please type your email legacy: <b>{JSON.parse(localStorage.getItem("user") || "{}").email}</b></label>
                            <input
                                type="email"
                                className="gg-deletion-confirm-input"
                                value={confirmEmail}
                                onChange={(e) => setConfirmEmail(e.target.value)}
                                placeholder="Verify your email address"
                            />
                        </div>

                        <div className="account-modal-footer">
                            <button type="button" className="gg-deletion-back-btn" onClick={() => setIsDeleting(false)}>Go Back</button>
                            <button
                                type="button"
                                className="gg-deletion-final-action-btn"
                                disabled={loading || confirmEmail !== JSON.parse(localStorage.getItem("user") || "{}").email}
                                onClick={handleDeleteAccount}
                            >
                                {loading ? "Deleting..." : "Permanently Terminate Account"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageAccountModal;
