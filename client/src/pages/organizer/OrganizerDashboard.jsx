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
  DollarSign,
  User,
  Mail,
  Lock,
  Shield,
  Eye,
  EyeOff
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
  const [activeTab, setActiveTab] = useState("events"); // 'events' or 'settings'

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [focusedInput, setFocusedInput] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      if (token) {
        // Fetch events
        try {
          const eventsRes = await axios.get("https://gogather-server.onrender.com/api/events/my", config);
          setEvents(eventsRes.data);
        } catch (err) {
          console.error("Error fetching events:", err);
        }

        // Fetch stats
        try {
          const statsRes = await axios.get("https://gogather-server.onrender.com/api/events/stats", config);
          setStats(statsRes.data);
        } catch (err) {
          console.error("Error fetching stats:", err);
        }
      } else {
        const res = await axios.get("https://gogather-server.onrender.com/api/events");
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
      await axios.delete(`https://gogather-server.onrender.com/api/events/${eventToDelete._id}`, config);
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
          const profile = await axios.get("https://gogather-server.onrender.com/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setOrganizerName(profile.data.name || "");
          setOrganizerEmail(profile.data.email || "");
          setSettingsForm(prev => ({
            ...prev,
            name: profile.data.name || "",
            email: profile.data.email || ""
          }));
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsError("");
    setSettingsSuccess("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put("https://gogather-server.onrender.com/api/auth/update-profile", {
        name: settingsForm.name,
        email: settingsForm.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrganizerName(res.data.user.name);
      setOrganizerEmail(res.data.user.email);
      localStorage.setItem("userName", res.data.user.name);
      setSettingsSuccess("Profile updated successfully! ✅");
    } catch (err) {
      setSettingsError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (settingsForm.newPassword !== settingsForm.confirmPassword) {
      setSettingsError("New passwords do not match");
      return;
    }

    setSettingsLoading(true);
    setSettingsError("");
    setSettingsSuccess("");

    try {
      const token = localStorage.getItem("token");
      await axios.put("https://gogather-server.onrender.com/api/auth/update-profile", {
        currentPassword: settingsForm.currentPassword,
        password: settingsForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSettingsSuccess("Password changed successfully! ✅");
      setSettingsForm(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
    } catch (err) {
      setSettingsError(err.response?.data?.message || "Failed to change password");
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div style={styles.layout}>
      <DashboardSidebar
        organizerName={organizerName || localStorage.getItem("userName")}
        onLogout={handleLogout}
      />

      <main style={styles.mainContent} className="organizer-main-content">
        <style>{`
          @media (max-width: 768px) {
            .organizer-main-content {
              margin-left: 0 !important;
              padding: 24px 16px !important;
            }
            .sidebar-toggle-btn {
              display: flex !important;
            }
          }
          @media (max-width: 600px) {
            .responsive-stats-grid, .responsive-event-grid {
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
            .responsive-stats-grid > div, .responsive-event-grid > div {
              flex: 0 0 280px !important;
              min-width: 280px !important;
            }
          }
        `}</style>
        {/* Header */}
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="sidebar-toggle-btn"
              onClick={() => window.dispatchEvent(new Event("toggleOrganizerSidebar"))}
              style={styles.toggleBtn}
            >
              ☰
            </button>
            <div>
              <h1 style={styles.title}>Welcome back, {organizerName || "Organizer"}!</h1>
              <p style={styles.subtitle}>Here's what's happening with your events today.</p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <div style={styles.tabSwitcher}>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === 'events' ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab('events')}
              >
                Dashboard
              </button>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === 'settings' ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </div>
            <button style={styles.primaryButton} onClick={() => navigate("/add-event")}>
              <Plus size={18} />
              Add New Event
            </button>
          </div>
        </header>

        {activeTab === 'events' ? (
          <>
            {/* Stats Grid */}
            <div style={styles.statsGrid} className="responsive-stats-grid">
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
                <div style={styles.eventGrid} className="responsive-event-grid">
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
          </>
        ) : (
          <div style={styles.settingsSection}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Account Settings</h2>
              <p style={styles.sectionSubtitle}>Manage your personal information and security.</p>
            </div>

            {settingsError && <div style={styles.errorBanner}>{settingsError}</div>}
            {settingsSuccess && <div style={styles.successBanner}>{settingsSuccess}</div>}

            <div style={styles.settingsGrid}>
              {/* Profile Settings */}
              <div style={styles.settingsCard}>
                <div style={styles.cardHeader}>
                  <div style={styles.iconCircle}>
                    <User size={20} color="#ff007a" />
                  </div>
                  <h3 style={styles.cardTitle}>Profile Information</h3>
                </div>
                <form onSubmit={handleUpdateProfile} style={styles.settingsForm}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Full Name</label>
                    <div style={styles.inputWrapper}>
                      <User size={18} style={styles.inputIcon} />
                      <input
                        type="text"
                        style={{
                          ...styles.premiumInput,
                          ...(focusedInput === 'name' ? styles.premiumInputFocus : {})
                        }}
                        placeholder="Your Name"
                        value={settingsForm.name}
                        onFocus={() => setFocusedInput('name')}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Email Address</label>
                    <div style={styles.inputWrapper}>
                      <Mail size={18} style={styles.inputIcon} />
                      <input
                        type="email"
                        style={{
                          ...styles.premiumInput,
                          ...(focusedInput === 'email' ? styles.premiumInputFocus : {})
                        }}
                        placeholder="email@example.com"
                        value={settingsForm.email}
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    style={styles.premiumSubmitBtn}
                    disabled={settingsLoading}
                  >
                    {settingsLoading ? "Updating..." : "Update Profile"}
                  </button>
                </form>
              </div>

              {/* Security Settings */}
              <div style={styles.settingsCard}>
                <div style={styles.cardHeader}>
                  <div style={styles.iconCircle}>
                    <Shield size={20} color="#ff007a" />
                  </div>
                  <h3 style={styles.cardTitle}>Security & Password</h3>
                </div>
                <form onSubmit={handleChangePassword} style={styles.settingsForm}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Current Password</label>
                    <div style={styles.inputWrapper}>
                      <Lock size={18} style={styles.inputIcon} />
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        style={{
                          ...styles.premiumInput,
                          paddingRight: '45px',
                          ...(focusedInput === 'currentPassword' ? styles.premiumInputFocus : {})
                        }}
                        placeholder="••••••••"
                        value={settingsForm.currentPassword}
                        onFocus={() => setFocusedInput('currentPassword')}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, currentPassword: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        style={styles.eyeButton}
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>New Password</label>
                    <div style={styles.inputWrapper}>
                      <Lock size={18} style={styles.inputIcon} />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        style={{
                          ...styles.premiumInput,
                          paddingRight: '45px',
                          ...(focusedInput === 'newPassword' ? styles.premiumInputFocus : {})
                        }}
                        placeholder="Min. 8 characters"
                        value={settingsForm.newPassword}
                        onFocus={() => setFocusedInput('newPassword')}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        style={styles.eyeButton}
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Confirm New Password</label>
                    <div style={styles.inputWrapper}>
                      <Lock size={18} style={styles.inputIcon} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        style={{
                          ...styles.premiumInput,
                          paddingRight: '45px',
                          ...(focusedInput === 'confirmPassword' ? styles.premiumInputFocus : {})
                        }}
                        placeholder="Confirm new password"
                        value={settingsForm.confirmPassword}
                        onFocus={() => setFocusedInput('confirmPassword')}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, confirmPassword: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        style={styles.eyeButton}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    style={styles.premiumSubmitBtn}
                    disabled={settingsLoading}
                  >
                    {settingsLoading ? "Saving..." : "Change Password"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
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
    transition: 'all 0.3s ease',
  },
  toggleBtn: {
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  tabSwitcher: {
    display: 'flex',
    backgroundColor: '#fff',
    padding: '4px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  tabBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    backgroundColor: '#fff1f2',
    color: '#ff007a',
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
  settingsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '4px',
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  settingsForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  errorBanner: {
    padding: '16px',
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    borderRadius: '12px',
    border: '1px solid #fee2e2',
    fontSize: '14px',
    fontWeight: '500',
  },
  successBanner: {
    padding: '16px 20px',
    backgroundColor: '#ecfdf5',
    color: '#059669',
    borderRadius: '12px',
    border: '1px solid #d1fae5',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.07)',
    border: '1px solid #f1f5f9',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '25px',
    paddingBottom: '15px',
    borderBottom: '1px solid #f8fafc',
  },
  iconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: '#fff1f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#94a3b8',
    transition: 'color 0.2s',
  },
  premiumInput: {
    width: '100%',
    padding: '12px 16px 12px 42px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '15px',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  premiumInputFocus: {
    borderColor: '#ff007a',
    backgroundColor: '#fff',
    boxShadow: '0 0 0 4px rgba(255, 0, 122, 0.1)',
  },
  premiumSubmitBtn: {
    padding: '12px 24px',
    backgroundColor: '#ff007a',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(255, 0, 122, 0.2)',
    width: 'fit-content',
    marginTop: '5px',
  },
  eyeButton: {
    position: 'absolute',
    right: '14px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    transition: 'color 0.2s',
    zIndex: 2,
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
