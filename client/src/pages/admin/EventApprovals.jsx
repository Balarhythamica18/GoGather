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
                                <img src={event.image || "https://via.placeholder.com/400x200"} alt={event.title} />
                                <div className="status-badge-mini"><Clock size={12} /> Pending</div>
                            </div>

                            <div className="approval-card__content">
                                <h3>{event.title}</h3>
                                <p className="event-meta"><Calendar size={14} /> {event.month} {event.date} at {event.time}</p>
                                <p className="event-meta"><MapPin size={14} /> {event.location}, {event.address}</p>

                                <div className="organizer-info">
                                    <p><User size={14} /> <strong>{event.organizer?.name || event.organizerDetails?.name}</strong></p>
                                    <p><Mail size={14} /> {event.organizer?.email || event.organizerDetails?.contactEmail}</p>
                                </div>

                                <div className="event-desc-preview">
                                    {event.description?.substring(0, 100)}...
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
                                    <CheckCircle size={18} /> Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .approvals-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 2rem;
                    margin-top: 2rem;
                }
                .approval-card {
                    background: #111;
                    border: 1px solid #333;
                    border-radius: 16px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .approval-card__image {
                    height: 180px;
                    position: relative;
                }
                .approval-card__image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .status-badge-mini {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: rgba(255, 204, 0, 0.9);
                    color: #000;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .approval-card__content {
                    padding: 1.5rem;
                    flex: 1;
                }
                .approval-card__content h3 {
                    margin: 0 0 1rem 0;
                    color: #fff;
                    font-size: 1.25rem;
                }
                .event-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #888;
                    font-size: 0.85rem;
                    margin-bottom: 0.5rem;
                }
                .organizer-info {
                    background: rgba(255,255,255,0.05);
                    padding: 0.8rem;
                    border-radius: 8px;
                    margin: 1rem 0;
                }
                .organizer-info p {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0;
                    font-size: 0.85rem;
                    color: #ccc;
                }
                .event-desc-preview {
                    color: #666;
                    font-size: 0.85rem;
                    font-style: italic;
                }
                .approval-card__actions {
                    padding: 1rem;
                    background: #1a1a1a;
                    display: flex;
                    gap: 1rem;
                }
                .action-btn {
                    flex: 1;
                    padding: 0.7rem;
                    border-radius: 8px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .action-btn.reject {
                    background: #222;
                    color: #ff4d4d;
                }
                .action-btn.reject:hover {
                    background: #ff4d4d22;
                }
                .action-btn.approve {
                    background: #00ff88;
                    color: #000;
                }
                .action-btn.approve:hover {
                    box-shadow: 0 0 15px #00ff8844;
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
