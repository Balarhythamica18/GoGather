import React, { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Clock, MapPin, User, Mail, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import "../admin/Admin.css";

const EventApprovals = () => {
    const [pendingEvents, setPendingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchPendingEvents = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("/api/admin/events/pending", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPendingEvents(res.data);
        } catch (error) {
            console.error("Error fetching pending events:", error);
            toast.error("Failed to load pending events");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingEvents();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        setProcessingId(id);
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`/api/admin/events/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPendingEvents(pendingEvents.filter(e => e._id !== id));
            toast.success(`Event ${status} successfully`);
        } catch (error) {
            console.error(`Error ${status}ing event:`, error);
            toast.error(`Failed to ${status} event`);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="event-approvals">
            <h1 className="admin-dashboard__title">Event Approvals</h1>
            <p className="admin-dashboard__subtitle">Review and confirm organizer submissions</p>

            {loading ? (
                <div className="impact-loading">Loading pending events...</div>
            ) : pendingEvents.length === 0 ? (
                <div className="admin-dashboard__placeholder">
                    <p>No pending events for review</p>
                </div>
            ) : (
                <div className="approvals-grid">
                    {pendingEvents.map((event) => (
                        <div key={event._id} className="approval-card">
                            <div className="approval-card__image">
                                <img src={event.image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=400"} alt={event.title} />
                                <div className="status-badge-mini"><Clock size={12} /> Pending Review</div>
                            </div>

                            <div className="approval-card__content">
                                <h3>{event.title}</h3>
                                <div className="event-meta-group">
                                    <p className="event-meta"><Calendar size={14} /> {event.month} {event.date} at {event.time}</p>
                                    <p className="event-meta"><MapPin size={14} /> {event.location}</p>
                                </div>

                                <div className="organizer-info">
                                    <div className="org-label">Organizer Details</div>
                                    <p><User size={14} /> <strong>{event.organizer?.name || event.organizerDetails?.name}</strong></p>
                                    <p><Mail size={14} /> {event.organizer?.email || event.organizerDetails?.contactEmail}</p>
                                </div>

                                <div className="event-desc-preview">
                                    {event.description?.substring(0, 80)}...
                                </div>
                            </div>

                            <div className="approval-card__actions">
                                <button
                                    className="action-btn reject"
                                    onClick={() => handleStatusUpdate(event._id, "rejected")}
                                    disabled={processingId === event._id}
                                >
                                    <XCircle size={18} /> Reject
                                </button>
                                <button
                                    className="action-btn approve"
                                    onClick={() => handleStatusUpdate(event._id, "approved")}
                                    disabled={processingId === event._id}
                                >
                                    <CheckCircle size={18} /> Approve Event
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .approvals-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 24px;
                    margin-top: 24px;
                }
                @media (max-width: 600px) {
                    .approvals-grid {
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
                    .approval-card {
                        flex: 0 0 300px !important;
                        min-width: 300px !important;
                    }
                }
                .approval-card {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    transition: transform 0.2s;
                }
                .approval-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                .approval-card__image {
                    height: 160px;
                    position: relative;
                }
                .approval-card__image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .status-badge-mini {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    background: #fefce8;
                    color: #854d0e;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border: 1px solid #fef08a;
                }
                .approval-card__content {
                    padding: 24px;
                    flex: 1;
                }
                .approval-card__content h3 {
                    margin: 0 0 16px 0;
                    color: #1e293b;
                    font-size: 1.15rem;
                    font-weight: 800;
                }
                .event-meta-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 20px;
                }
                .event-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #64748b;
                    font-size: 0.85rem;
                    margin: 0;
                }
                .organizer-info {
                    background: #f8fafc;
                    padding: 16px;
                    border-radius: 12px;
                    margin-bottom: 16px;
                    border: 1px solid #f1f5f9;
                }
                .org-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #94a3b8;
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                .organizer-info p {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 4px 0 0 0;
                    font-size: 0.85rem;
                    color: #334155;
                }
                .event-desc-preview {
                    color: #94a3b8;
                    font-size: 0.85rem;
                    line-height: 1.5;
                }
                .approval-card__actions {
                    padding: 16px 24px;
                    background: #f8fafc;
                    display: flex;
                    gap: 12px;
                    border-top: 1px solid #f1f5f9;
                }
                .action-btn {
                    flex: 1;
                    padding: 10px;
                    border-radius: 10px;
                    border: none;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                .action-btn.reject {
                    background: #fff;
                    color: #ef4444;
                    border: 1px solid #fee2e2;
                }
                .action-btn.reject:hover {
                    background: #fef2f2;
                }
                .action-btn.approve {
                    background: #ff007a;
                    color: #fff;
                }
                .action-btn.approve:hover {
                    background: #e6006e;
                    box-shadow: 0 4px 12px rgba(255, 0, 122, 0.3);
                }
                .action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default EventApprovals;
