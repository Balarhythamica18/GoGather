import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  DollarSign
} from "lucide-react";
import StatCard from "../../components/organizer/StatCard";
import DashboardSidebar from "../../components/organizer/DashboardSidebar";

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    approvedEvents: 0,
    pendingEvents: 0,
    rejectedEvents: 0,
    totalBookings: 0,
    totalRevenue: 0
  });
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      if (token) {
        // Fetch events
        try {
          const eventsRes = await axios.get("http://localhost:5000/api/events/my", config);
          setEvents(eventsRes.data);
        } catch (err) {
          console.error("Error fetching events:", err);
        }

        // Fetch stats
        try {
          const statsRes = await axios.get("http://localhost:5000/api/events/stats", config);
          setStats(statsRes.data);
        } catch (err) {
          console.error("Error fetching stats:", err);
        }
      } else {
        const res = await axios.get("http://localhost:5000/api/events");
        setEvents(res.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (event) => {
    setEventToDelete(event);
    setShowConfirmation(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.delete(`http://localhost:5000/api/events/${eventToDelete._id}`, config);
      fetchData();
      setShowConfirmation(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Error deleting event: " + (error.response?.data?.message || error.message));
      setShowConfirmation(false);
      setEventToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmation(false);
    setEventToDelete(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    navigate('/');
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const profile = await axios.get("http://localhost:5000/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setOrganizerName(profile.data.name || "");
          setOrganizerEmail(profile.data.email || "");
        } catch (err) {
          console.error("Error fetching profile:", err.response?.data || err.message);
        }
      }
      await fetchData();
    };
    init();
  }, []);

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.layout}>
      <DashboardSidebar
        organizerName={organizerName || localStorage.getItem("userName")}
        onLogout={handleLogout}
      />

      <main style={styles.mainContent}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Welcome back, {organizerName || "Organizer"}!</h1>
            <p style={styles.subtitle}>Here's what's happening with your events today.</p>
          </div>
          <button style={styles.primaryButton} onClick={() => navigate("/add-event")}>
            <Plus size={18} />
            Add New Event
          </button>
        </header>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <StatCard
            title="Total Posted"
            value={stats.totalEvents}
            icon={Calendar}
            color="#ff007a"
          />
          <StatCard
            title="Approved Events"
            value={stats.approvedEvents}
            icon={CheckCircle}
            color="#ff007a"
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Users}
            color="#ff007a"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="#ff007a"
          />
        </div>

        {/* Content Section */}
        <div style={styles.contentSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Manage Events</h2>
            <div style={styles.controls}>
              <div style={styles.searchWrapper}>
                <Search size={18} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search events..."
                  style={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button style={styles.secondaryButton}>
                <Filter size={18} />
                Filter
              </button>
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingWrapper}>
              <p>Loading your events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📅</div>
              <h3>No events found</h3>
              <p>You haven't created any events yet or none match your search.</p>
              <button style={styles.primaryButton} onClick={() => navigate("/add-event")}>
                Create Your First Event
              </button>
            </div>
          ) : (
            <div style={styles.eventGrid}>
              {filteredEvents.map((event) => (
                <div key={event._id} style={styles.eventCard}>
                  <div style={styles.cardImageWrapper}>
                    <img src={event.image} alt={event.title} style={styles.cardImage} />
                    <div style={{
                      ...styles.statusTag,
                      ...(event.status === "approved" ? styles.statusApproved :
                        event.status === "rejected" ? styles.statusRejected : styles.statusPending)
                    }}>
                      {event.status === "approved" ? <CheckCircle size={12} /> :
                        event.status === "rejected" ? <AlertCircle size={12} /> : <Clock size={12} />}
                      {event.status || "pending"}
                    </div>
                  </div>

                  <div style={styles.cardBody}>
                    <h3 style={styles.eventTitle}>{event.title}</h3>
                    <div style={styles.eventMeta}>
                      <span><Calendar size={14} /> {event.date} {event.month}</span>
                      <span><MapPin size={14} /> {event.location}</span>
                    </div>

                    <div style={styles.cardFooter}>
                      <div style={styles.priceTag}>
                        {event.price ? `₹${event.price}` : 'Free'}
                      </div>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.iconButton}
                          onClick={() => navigate(`/add-event/${event._id}`)}
                          title="Edit Event"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          style={{ ...styles.iconButton, color: '#f43f5e' }}
                          onClick={() => handleDelete(event)}
                          title="Delete Event"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmation && eventToDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalIcon}>
              <Trash2 size={32} color="#f43f5e" />
            </div>
            <h2 style={styles.modalTitle}>Delete Event?</h2>
            <p style={styles.modalMessage}>
              Are you sure you want to delete <strong>{eventToDelete.title}</strong>? This action cannot be undone.
            </p>
            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={cancelDelete}>Cancel</button>
              <button style={styles.deleteConfirmButton} onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  mainContent: {
    flex: 1,
    marginLeft: '260px',
    padding: '40px 60px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#ff007a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(255, 0, 122, 0.2)',
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#fff',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  contentSection: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  controls: {
    display: 'flex',
    gap: '12px',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 12px',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    minWidth: '280px',
  },
  searchInput: {
    border: 'none',
    background: 'none',
    padding: '10px 0',
    fontSize: '14px',
    color: '#1e293b',
    outline: 'none',
    width: '100%',
  },
  eventGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  eventCard: {
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardImageWrapper: {
    position: 'relative',
    height: '160px',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  statusTag: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    backdropFilter: 'blur(4px)',
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    color: '#fff',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    color: '#fff',
  },
  statusRejected: {
    backgroundColor: 'rgba(244, 63, 94, 0.9)',
    color: '#fff',
  },
  cardBody: {
    padding: '20px',
  },
  eventTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 12px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  eventMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '20px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
  },
  priceTag: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ff007a',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  loadingWrapper: {
    display: 'flex',
    justifyContent: 'center',
    padding: '60px 0',
    color: '#64748b',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    width: '90%',
    maxWidth: '400px',
    textAlign: 'center',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#fff1f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 12px 0',
  },
  modalMessage: {
    fontSize: '16px',
    color: '#64748b',
    lineHeight: '1.5',
    marginBottom: '28px',
  },
  modalFooter: {
    display: 'flex',
    gap: '12px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    color: '#64748b',
    fontWeight: '600',
    cursor: 'pointer',
  },
  deleteConfirmButton: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#f43f5e',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default OrganizerDashboard;
