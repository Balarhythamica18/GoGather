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
        (a.userId?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.userId?.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalSold = attendees.reduce((acc, curr) => acc + (curr.ticketCount || curr.seats?.length || 1), 0);
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
                                    <span style={styles.statLabel}>Tickets shown</span>
                                    <span style={styles.statValue}>{totalSold}</span>
                                </div>
                                <div style={styles.statBox}>
                                    <span style={styles.statLabel}>Remaining</span>
                                    <span style={styles.statValue}>{event.capacity ? Math.max(0, event.capacity - totalSold) : (event.capacity === 0 ? 0 : "∞")}</span>
                                </div>
                            </div>
                            <div style={styles.progressContainer}>
                                <div style={{ ...styles.progressBar, width: `${Math.min(100, fillPercentage)}%` }} />
                            </div>
                            <p style={styles.progressText}>{fillPercentage}% of venue capacity filled</p>
                        </div>

                        <div style={styles.infoCard}>
                            <h3 style={styles.sectionTitle}><MapPin size={18} /> Venue & Location</h3>
                            <p style={styles.addressText}>{event.address || event.location}</p>
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
                                <div style={styles.loadingContainer}>
                                    <div style={styles.spinner}></div>
                                    <p style={styles.emptyText}>Loading attendees...</p>
                                </div>
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
                                                    🕐 {formatCheckInTime(a.checkInTime)}
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
                                <div style={styles.emptyState}>
                                    <Users size={48} color="#e2e8f0" style={{ marginBottom: '12px' }} />
                                    <p style={styles.emptyText}>No attendees found matching your search.</p>
                                </div>
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
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: '20px',
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '28px',
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        fontFamily: "'Outfit', sans-serif",
    },
    header: {
        padding: '24px 32px',
        borderBottom: '1.5px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    title: {
        fontSize: '22px',
        fontWeight: '800',
        color: '#0f172a',
        margin: 0,
        letterSpacing: '-0.02em',
    },
    badge: {
        padding: '6px 14px',
        borderRadius: '20px',
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        fontSize: '11px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    closeBtn: {
        background: '#f8fafc',
        border: 'none',
        color: '#94a3b8',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '12px',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
        backgroundColor: '#fff',
        borderRadius: '20px',
        padding: '24px',
        border: '1.5px solid #f1f5f9',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
    },
    sectionTitle: {
        fontSize: '15px',
        fontWeight: '800',
        color: '#0f172a',
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '20px',
    },
    statBox: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    statLabel: {
        fontSize: '10px',
        textTransform: 'uppercase',
        color: '#94a3b8',
        fontWeight: '800',
        letterSpacing: '0.08em',
    },
    statValue: {
        fontSize: '22px',
        fontWeight: '900',
        color: '#0b0f5b',
        letterSpacing: '-0.02em',
    },
    progressContainer: {
        height: '10px',
        backgroundColor: '#f1f5f9',
        borderRadius: '50px',
        overflow: 'hidden',
        marginBottom: '10px',
    },
    progressBar: {
        height: '100%',
        background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
        borderRadius: '50px',
    },
    progressText: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#64748b',
        margin: 0,
    },
    addressText: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#475569',
        margin: '0 0 12px 0',
        lineHeight: '1.5',
    },
    link: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: '#0b0f5b',
        fontSize: '13px',
        fontWeight: '800',
        textDecoration: 'none',
        transition: 'all 0.2s',
    },
    sessionList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    sessionItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px',
        borderRadius: '12px',
        backgroundColor: '#f8fafc',
    },
    sessionTime: {
        fontSize: '11px',
        fontWeight: '800',
        color: '#0b0f5b',
        backgroundColor: '#e0e7ff',
        padding: '4px 10px',
        borderRadius: '8px',
        minWidth: '95px',
        textAlign: 'center',
    },
    sessionName: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#475569',
    },
    scannerBtn: {
        width: '100%',
        padding: '16px',
        borderRadius: '16px',
        border: 'none',
        background: 'linear-gradient(135deg, #0b0f5b 0%, #161b7e 100%)',
        color: '#fff',
        fontSize: '15px',
        fontWeight: '800',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 10px 25px -5px rgba(11, 15, 91, 0.3)',
    },
    rightCol: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        borderRadius: '20px',
        border: '1.5px solid #f1f5f9',
        overflow: 'hidden',
    },
    attendeeHeader: {
        padding: '24px',
        borderBottom: '1.5px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#f8fafc',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1.5px solid #e2e8f0',
    },
    searchInput: {
        border: 'none',
        background: 'none',
        fontSize: '14px',
        fontWeight: '600',
        outline: 'none',
        width: '100%',
        color: '#1e293b',
        fontFamily: 'inherit',
    },
    attendeeList: {
        maxHeight: '450px',
        overflowY: 'auto',
    },
    attendeeItem: {
        padding: '16px 24px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background-color 0.2s',
    },
    attendeeInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    attendeeName: {
        fontSize: '15px',
        fontWeight: '800',
        color: '#0f172a',
    },
    attendeeEmail: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#64748b',
    },
    bookingStatus: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px',
    },
    ticketCount: {
        fontSize: '13px',
        fontWeight: '800',
        color: '#0b0f5b',
    },
    checkInTime: {
        fontSize: '11px',
        fontWeight: '800',
        color: '#059669',
        backgroundColor: '#dcfce7',
        padding: '2px 8px',
        borderRadius: '6px',
    },
    checkedInBadge: {
        fontSize: '10px',
        fontWeight: '800',
        color: '#fff',
        backgroundColor: '#10b981',
        padding: '4px 10px',
        borderRadius: '50px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    pendingBadge: {
        fontSize: '10px',
        fontWeight: '800',
        color: '#d97706',
        backgroundColor: '#fef3c7',
        padding: '4px 10px',
        borderRadius: '50px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '14px',
        fontWeight: '600',
        margin: 0,
    },
    loadingContainer: {
        padding: '60px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    emptyState: {
        padding: '60px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
    },
    spinner: {
        width: '32px',
        height: '32px',
        border: '3px solid #f1f5f9',
        borderTopColor: '#0b0f5b',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    }
};

export default EventDetailsModal;
