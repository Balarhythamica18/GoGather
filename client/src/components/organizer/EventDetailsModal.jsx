import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import {
    X,
    Users,
    MapPin,
    Calendar,
    Clock,
    ChevronRight,
    Search,
    ExternalLink,
    PieChart,
    QrCode
} from "lucide-react";

const EventDetailsModal = ({ event, onClose, onOpenScanner }) => {
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchAttendees = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${API_BASE_URL}/api/bookings/attendees/${event._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAttendees(res.data);
            } catch (err) {
                console.error("Error fetching attendees:", err);
            } finally {
                setLoading(false);
            }
        };

        if (event?._id) fetchAttendees();
    }, [event?._id]);

    const filteredAttendees = attendees.filter(a =>
        a.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.userId?.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalSold = attendees.reduce((acc, curr) => acc + (curr.ticketCount || curr.seats?.length || 1), 0);
    const totalCheckedIn = attendees.reduce((acc, curr) => acc + (curr.isUsed ? (curr.ticketCount || curr.seats?.length || 1) : 0), 0);
    const totalPending = totalSold - totalCheckedIn;
    const fillPercentage = event.capacity ? Math.round((totalSold / event.capacity) * 100) : 0;

    const formatCheckInTime = (checkInTime) => {
        if (!checkInTime) return "—";
        const date = new Date(checkInTime);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatSeatInfo = (booking) => {
        if (booking.seats && booking.seats.length > 0) {
            return booking.seats.join(", ");
        }
        return `${booking.ticketCount || 1} Ticket${booking.ticketCount !== 1 ? 's' : ''}`;
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div style={styles.headerTitle}>
                        <h2 style={styles.title}>{event.title}</h2>
                        <span style={styles.badge}>{event.category}</span>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div style={styles.content}>
                    {/* Left Column: Stats & Info */}
                    <div style={styles.leftCol}>
                        <div style={styles.infoCard}>
                            <h3 style={styles.sectionTitle}><PieChart size={18} /> Capacity & Sales</h3>
                            <div style={styles.statsGrid}>
                                <div style={styles.statBox}>
                                    <span style={styles.statLabel}>Total Capacity</span>
                                    <span style={styles.statValue}>{event.capacity !== undefined ? event.capacity : "N/A"}</span>
                                </div>
                                <div style={styles.statBox}>
                                    <span style={styles.statLabel}>Tickets Sold</span>
                                    <span style={styles.statValue}>{totalSold}</span>
                                </div>
                                <div style={styles.statBox}>
                                    <span style={styles.statLabel}>Pending</span>
                                    <span style={{ ...styles.statValue, color: '#ef4444' }}>{totalPending}</span>
                                </div>
                            </div>
                            <div style={styles.progressContainer}>
                                <div style={{ ...styles.progressBar, width: `${Math.min(100, fillPercentage)}%` }} />
                            </div>
                            <p style={styles.progressText}>{fillPercentage}% of venue capacity filled</p>
                        </div>

                        <div style={styles.infoCard}>
                            <h3 style={styles.sectionTitle}><MapPin size={18} /> Venue & Location</h3>
                            <p style={styles.addressText}>{event.address}, {event.location}</p>
                            {event.mapLink && (
                                <a href={event.mapLink} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                    View on Google Maps <ExternalLink size={14} />
                                </a>
                            )}
                        </div>

                        {event.sessions && event.sessions.length > 0 && (
                            <div style={styles.infoCard}>
                                <h3 style={styles.sectionTitle}><Clock size={18} /> Event Sessions</h3>
                                <div style={styles.sessionList}>
                                    {event.sessions.map((s, i) => (
                                        <div key={i} style={styles.sessionItem}>
                                            <span style={styles.sessionTime}>{s.startTime} - {s.endTime}</span>
                                            <span style={styles.sessionName}>{s.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            style={styles.scannerBtn}
                            onClick={() => onOpenScanner(event)}
                        >
                            <QrCode size={20} /> Open QR Scanner
                        </button>
                    </div>

                    {/* Right Column: Attendees */}
                    <div style={styles.rightCol}>
                        <div style={styles.attendeeHeader}>
                            <h3 style={styles.sectionTitle}><Users size={18} /> Attendees ({attendees.length})</h3>
                            <div style={styles.searchBox}>
                                <Search size={16} color="#94a3b8" />
                                <input
                                    placeholder="Search attendees..."
                                    style={styles.searchInput}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={styles.attendeeList}>
                            {loading ? (
                                <p style={styles.emptyText}>Loading attendees...</p>
                            ) : filteredAttendees.length > 0 ? (
                                filteredAttendees.map((a, i) => (
                                    <div key={i} style={styles.attendeeItem}>
                                        <div style={styles.attendeeInfo}>
                                            <span style={styles.attendeeName}>{a.userId?.name}</span>
                                            <span style={styles.attendeeEmail}>{a.userId?.email}</span>
                                        </div>
                                        <div style={styles.bookingStatus}>
                                            <span style={styles.ticketCount}>
                                                {formatSeatInfo(a)}
                                            </span>
                                            {a.isUsed && (
                                                <span style={styles.checkInTime}>
                                                    <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                    {formatCheckInTime(a.checkInTime)}
                                                </span>
                                            )}
                                            {a.isUsed ? (
                                                <span style={styles.checkedInBadge}>Checked In</span>
                                            ) : (
                                                <span style={styles.pendingBadge}>Pending Entry</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={styles.emptyText}>No attendees found matching your search.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: '20px',
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    header: {
        padding: '24px 32px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(to right, #f8fafc, #fff)',
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    title: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#1e293b',
        margin: 0,
    },
    badge: {
        padding: '4px 12px',
        borderRadius: '20px',
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '50%',
        transition: 'all 0.2s',
        ':hover': { backgroundColor: '#f1f5f9', color: '#1e293b' }
    },
    content: {
        padding: '32px',
        display: 'grid',
        gridTemplateColumns: '1fr 1.5fr',
        gap: '32px',
        overflowY: 'auto',
    },
    leftCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    infoCard: {
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #e2e8f0',
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#1e293b',
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '20px',
    },
    statBox: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    statLabel: {
        fontSize: '10px',
        textTransform: 'uppercase',
        color: '#94a3b8',
        fontWeight: '600',
    },
    statValue: {
        fontSize: '20px',
        fontWeight: '800',
        color: '#0b0f5b',
    },
    progressContainer: {
        height: '8px',
        backgroundColor: '#e2e8f0',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '8px',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#0b0f5b',
        borderRadius: '4px',
    },
    progressText: {
        fontSize: '12px',
        color: '#64748b',
        margin: 0,
    },
    addressText: {
        fontSize: '14px',
        color: '#475569',
        margin: '0 0 12px 0',
        lineHeight: '1.5',
    },
    link: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        color: '#0b0f5b',
        fontSize: '14px',
        fontWeight: '600',
        textDecoration: 'none',
    },
    sessionList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    sessionItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    sessionTime: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#0b0f5b',
        backgroundColor: '#e0e7ff',
        padding: '2px 8px',
        borderRadius: '6px',
        minWidth: '90px',
        textAlign: 'center',
    },
    sessionName: {
        fontSize: '14px',
        color: '#475569',
    },
    scannerBtn: {
        width: '100%',
        padding: '16px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: '#0b0f5b',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        transition: 'all 0.2s',
        boxShadow: '0 10px 15px -3px rgba(11, 15, 91, 0.2)',
    },
    rightCol: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
    },
    attendeeHeader: {
        padding: '20px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#f8fafc',
        padding: '8px 16px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        flex: 1,
        minWidth: '200px',
    },
    searchInput: {
        border: 'none',
        background: 'none',
        fontSize: '14px',
        outline: 'none',
        width: '100%',
        color: '#1e293b',
    },
    attendeeList: {
        maxHeight: '400px',
        overflowY: 'auto',
    },
    attendeeItem: {
        padding: '16px 20px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background-color 0.2s',
        ':hover': { backgroundColor: '#f8fafc' }
    },
    attendeeInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    attendeeName: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#1e293b',
    },
    attendeeEmail: {
        fontSize: '13px',
        color: '#64748b',
    },
    bookingStatus: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '4px',
    },
    ticketCount: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#0b0f5b',
    },
    checkInTime: {
        fontSize: '11px',
        fontWeight: '600',
        color: '#0b0f5b',
        backgroundColor: '#f1f5f9',
        padding: '2px 8px',
        borderRadius: '6px',
    },
    checkedInBadge: {
        fontSize: '10px',
        fontWeight: '700',
        color: '#0b0f5b',
        backgroundColor: '#f1f5f9',
        padding: '2px 8px',
        borderRadius: '10px',
        textTransform: 'uppercase',
    },
    pendingBadge: {
        fontSize: '10px',
        fontWeight: '700',
        color: '#d97706',
        backgroundColor: '#fef3c7',
        padding: '2px 8px',
        borderRadius: '10px',
        textTransform: 'uppercase',
    },
    emptyText: {
        padding: '40px',
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '14px',
    }
};

export default EventDetailsModal;
