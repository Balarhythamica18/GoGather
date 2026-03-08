import React, { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, Clock, AlertTriangle, X, Activity, Shield, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config";
import "./Admin.css";

const OrganizerManagement = () => {
    const [pendingOrganizers, setPendingOrganizers] = useState([]);
    const [approvedOrganizers, setApprovedOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending");
    const [selectedOrganizer, setSelectedOrganizer] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actionType, setActionType] = useState(null); // "approve" or "reject"

    const fetchOrganizers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [pendingRes, approvedRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/organizers/pending`, { headers }),
                axios.get(`${API_BASE_URL}/api/admin/organizers/approved`, { headers })
            ]);

            setPendingOrganizers(pendingRes.data || []);
            setApprovedOrganizers(approvedRes.data || []);
        } catch (error) {
            console.error("Error fetching organizers:", error);
            toast.error("Failed to load organizers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganizers();
    }, []);

    const handleApproveClick = (organizer) => {
        setSelectedOrganizer(organizer);
        setActionType("approve");
        setShowConfirmModal(true);
    };

    const handleRejectClick = (organizer) => {
        setSelectedOrganizer(organizer);
        setActionType("reject");
        setShowConfirmModal(true);
    };

    const confirmAction = async () => {
        if (!selectedOrganizer) return;

        try {
            const token = localStorage.getItem("token");
            const endpoint = actionType === "approve"
                ? `/api/admin/organizers/${selectedOrganizer._id}/approve`
                : `/api/admin/organizers/${selectedOrganizer._id}/reject`;

            await axios.patch(
                `${API_BASE_URL}${endpoint}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(`Organizer ${actionType === "approve" ? "approved" : "rejected"} successfully! ✅`);

            // Refresh the lists
            await fetchOrganizers();
            setShowConfirmModal(false);
            setSelectedOrganizer(null);
        } catch (error) {
            console.error(`Error ${actionType}ing organizer:`, error);
            toast.error(`Failed to ${actionType} organizer`);
        }
    };

    const OrganizerCard = ({ organizer, isPending }) => {
        const joinDate = new Date(organizer.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });

        return (
            <div style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#ffffff",
                transition: "all 0.2s ease"
            }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "16px", fontWeight: "600" }}>
                        {organizer.name}
                    </h3>
                    <div style={{ display: "flex", gap: "16px", fontSize: "14px", color: "#64748b" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Mail size={16} />
                            <span>{organizer.email}</span>
                        </div>
                        {organizer.location && (
                            <span>📍 {organizer.location}</span>
                        )}
                        <span>Joined: {joinDate}</span>
                    </div>
                    {!isPending && (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            marginTop: "8px",
                            color: "#22c55e",
                            fontSize: "13px",
                            fontWeight: "600"
                        }}>
                            <CheckCircle size={14} />
                            Verified & Approved
                        </div>
                    )}
                </div>

                {isPending && (
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={() => handleApproveClick(organizer)}
                            style={{
                                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                                color: "white",
                                border: "none",
                                padding: "10px 16px",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                            onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
                            onMouseLeave={e => e.target.style.transform = "translateY(0)"}
                        >
                            <CheckCircle size={16} />
                            Approve
                        </button>
                        <button
                            onClick={() => handleRejectClick(organizer)}
                            style={{
                                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                color: "white",
                                border: "none",
                                padding: "10px 16px",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                            onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
                            onMouseLeave={e => e.target.style.transform = "translateY(0)"}
                        >
                            <X size={16} />
                            Reject
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="admin-organizers">
            <div style={{ marginBottom: "32px" }}>
                <h1 className="admin-dashboard__title">Organizer Management</h1>
                <p className="admin-dashboard__subtitle">Review, approve, and manage event organizers on the platform.</p>
            </div>

            {/* Tabs */}
            <div style={{
                display: "flex",
                gap: "12px",
                marginBottom: "24px",
                borderBottom: "2px solid #e2e8f0",
                paddingBottom: "12px"
            }}>
                <button
                    onClick={() => setActiveTab("pending")}
                    style={{
                        background: activeTab === "pending" ? "linear-gradient(180deg, #0b0f5b 0%, #0a0d4a 100%)" : "transparent",
                        color: activeTab === "pending" ? "white" : "#64748b",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "15px",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <Clock size={16} />
                    Pending ({pendingOrganizers.length})
                </button>
                <button
                    onClick={() => setActiveTab("approved")}
                    style={{
                        background: activeTab === "approved" ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" : "transparent",
                        color: activeTab === "approved" ? "white" : "#64748b",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "15px",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <CheckCircle size={16} />
                    Approved ({approvedOrganizers.length})
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    <Activity className="animate-spin" style={{ margin: "0 auto 16px auto" }} />
                    <p>Fetching organizers...</p>
                </div>
            ) : (
                <div>
                    {activeTab === "pending" && (
                        <div>
                            {pendingOrganizers.length === 0 ? (
                                <div style={{
                                    textAlign: "center",
                                    padding: "48px 24px",
                                    backgroundColor: "#f8fafc",
                                    borderRadius: "8px",
                                    color: "#64748b"
                                }}>
                                    <Shield size={40} style={{ margin: "0 auto 16px auto", opacity: 0.5 }} />
                                    <p style={{ fontSize: "16px", fontWeight: "500" }}>No pending organizer approvals</p>
                                    <p style={{ fontSize: "14px", opacity: 0.7 }}>All organizers have been reviewed!</p>
                                </div>
                            ) : (
                                <div>
                                    {pendingOrganizers.map((organizer) => (
                                        <OrganizerCard
                                            key={organizer._id}
                                            organizer={organizer}
                                            isPending={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "approved" && (
                        <div>
                            {approvedOrganizers.length === 0 ? (
                                <div style={{
                                    textAlign: "center",
                                    padding: "48px 24px",
                                    backgroundColor: "#f8fafc",
                                    borderRadius: "8px",
                                    color: "#64748b"
                                }}>
                                    <CheckCircle size={40} style={{ margin: "0 auto 16px auto", opacity: 0.5 }} />
                                    <p style={{ fontSize: "16px", fontWeight: "500" }}>No approved organizers yet</p>
                                    <p style={{ fontSize: "14px", opacity: 0.7 }}>Approved organizers will appear here</p>
                                </div>
                            ) : (
                                <div>
                                    {approvedOrganizers.map((organizer) => (
                                        <OrganizerCard
                                            key={organizer._id}
                                            organizer={organizer}
                                            isPending={false}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && selectedOrganizer && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "32px",
                        maxWidth: "400px",
                        textAlign: "center",
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)"
                    }}>
                        {actionType === "approve" ? (
                            <>
                                <CheckCircle size={48} style={{ margin: "0 auto 16px auto", color: "#22c55e" }} />
                                <h2 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Approve Organizer?</h2>
                                <p style={{ color: "#64748b", marginBottom: "24px" }}>
                                    {selectedOrganizer.name} will be able to publish events directly without admin approval.
                                </p>
                            </>
                        ) : (
                            <>
                                <AlertTriangle size={48} style={{ margin: "0 auto 16px auto", color: "#ef4444" }} />
                                <h2 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Reject Organizer?</h2>
                                <p style={{ color: "#64748b", marginBottom: "24px" }}>
                                    {selectedOrganizer.name} will need admin approval for each event they create.
                                </p>
                            </>
                        )}

                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                style={{
                                    background: "#e2e8f0",
                                    color: "#1e293b",
                                    border: "none",
                                    padding: "10px 24px",
                                    borderRadius: "6px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "background 0.2s ease"
                                }}
                                onMouseEnter={e => e.target.style.background = "#cbd5e1"}
                                onMouseLeave={e => e.target.style.background = "#e2e8f0"}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                style={{
                                    background: actionType === "approve"
                                        ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                                        : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                    color: "white",
                                    border: "none",
                                    padding: "10px 24px",
                                    borderRadius: "6px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "transform 0.2s ease"
                                }}
                                onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
                                onMouseLeave={e => e.target.style.transform = "translateY(0)"}
                            >
                                {actionType === "approve" ? "Approve" : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizerManagement;
