import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getImageUrl } from "../../utils/imageUtils";
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
import EventDetailsModal from "../../components/organizer/EventDetailsModal";
import QRScannerModal from "../../components/organizer/QRScannerModal";
import DashboardSidebar from "../../components/organizer/DashboardSidebar";

import "./OrganizerDashboard.css";

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ 
    totalEvents: 0, 
    approvedEvents: 0, 
    pendingEvents: 0, 
    totalBookings: 0, 
    totalRevenue: 0 
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [isApprovedByAdmin, setIsApprovedByAdmin] = useState(false);
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      if (token) {
        try {
          const eventsRes = await axios.get(`${API_BASE_URL}/api/events/my`, config);
          setEvents(eventsRes.data || []);
        } catch (err) { console.error("Error fetching events:", err); }

        try {
          const statsRes = await axios.get(`${API_BASE_URL}/api/events/stats`, config);
          setStats(statsRes.data || {
            totalEvents: 0,
            approvedEvents: 0,
            pendingEvents: 0,
            rejectedEvents: 0,
            totalBookings: 0,
            totalRevenue: 0
          });
        } catch (err) { console.error("Error fetching stats:", err); }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.delete(`${API_BASE_URL}/api/events/${eventToDelete._id}`, config);
      fetchData();
      setShowConfirmation(false);
      setEventToDelete(null);
      toast.success("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
      setShowConfirmation(false);
    }
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
          const profile = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setOrganizerName(profile.data.name || "");
          setOrganizerEmail(profile.data.email || "");
          setIsApprovedByAdmin(profile.data.isApprovedByAdmin || false);
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

  const filteredEvents = events.filter(event => {
    const titleMatch = (event.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const locationMatch = (event.location || "").toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || locationMatch;
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsError("");
    setSettingsSuccess("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API_BASE_URL}/api/auth/update-profile`, {
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
      await axios.put(`${API_BASE_URL}/api/auth/update-profile`, {
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

  const handleEventAction = (event) => {
    setSelectedEvent(event);
    setShowDetails(true);
  };

  const handleOpenScanner = (event) => {
    setSelectedEvent(event);
    setShowScanner(true);
    setShowDetails(false);
  };

  return (
    <div className="organizer-dashboard">
      <DashboardSidebar
        organizerName={organizerName || localStorage.getItem("userName")}
        onLogout={handleLogout}
      />

      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-welcome">
            <h1>Welcome back, {organizerName || "Organizer"}!</h1>
            <p>Ready to host your next big event?</p>
          </div>
          <div className="header-actions">
            <div className="tab-switcher">
              <button
                className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                Dashboard
              </button>
              <button
                className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </div>
            <button className="btn-primary" onClick={() => navigate("/add-event")}>
              <Plus size={18} />
              New Event
            </button>
          </div>
        </header>

        {activeTab === 'events' ? (
          <>
            {/* Status Banners */}
            <div className={`status-banner ${isApprovedByAdmin ? 'approved' : 'pending'}`}>
              <div style={{ fontSize: '24px' }}>{isApprovedByAdmin ? '✨' : '⏳'}</div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>
                  {isApprovedByAdmin ? 'Account Fully Approved' : 'Verification Pending'}
                </h3>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>
                  {isApprovedByAdmin
                    ? 'Your events are now published instantly to the global audience.'
                    : 'Your events will go live as soon as our team verifies your business.'}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <StatCard title="Total Events" value={stats.totalEvents || 0} icon={Calendar} color="var(--primary)" trend="+2" />
              <StatCard title="Approved" value={stats.approvedEvents || 0} icon={CheckCircle} color="var(--success)" trend="+1" />
              <StatCard title="Bookings" value={stats.totalBookings || 0} icon={Users} color="var(--secondary)" trend="+12" />
              <StatCard title="Revenue" value={`₹${(stats.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} color="var(--primary)" trend="+₹5k" />
            </div>

            {/* Events Section */}
            <div className="events-section">
              <div className="section-header">
                <h2 className="section-title">Manage Your Events</h2>
                <div className="events-filters">
                  <div className="search-input-group">
                    <Search className="search-icon" size={18} />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="icon-btn"><Filter size={18} /></button>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading events...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center' }}>
                   <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                   <h3>No events found</h3>
                   <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Time to create something amazing!</p>
                   <button className="btn-primary" style={{ margin: '0 auto' }} onClick={() => navigate("/add-event")}>
                     Create First Event
                   </button>
                </div>
              ) : (
                <div className="event-grid">
                  {filteredEvents.map((event) => (
                                    <div
                                        key={event._id}
                                        className="event-card clickable"
                                        onClick={() => handleEventAction(event)}
                                    >
                      <div className="card-image-box">
                        <img src={getImageUrl(event.image)} alt={event.title} />
                        <div className={`status-badge ${event.status || 'pending'}`}>
                           {event.status === 'approved' ? <CheckCircle size={10} /> : <Clock size={10} />}
                           {event.status || 'pending'}
                        </div>
                      </div>
                      <div className="card-content">
                        <h3 className="card-title">{event.title}</h3>
                        <div className="card-info">
                          <div className="info-item"><Calendar size={14} /> {event.date} {event.month}</div>
                          <div className="info-item"><MapPin size={14} /> {event.location}</div>
                        </div>
                        <div className="card-actions">
                          <div className="price-box">{event.price ? `₹${event.price}` : 'Free'}</div>
                          <div className="action-btns">
                            <button className="icon-btn" onClick={(e) => { e.stopPropagation(); navigate(`/add-event/${event._id}`); }}><Edit size={16} /></button>
                            <button className="icon-btn delete" onClick={(e) => { e.stopPropagation(); setEventToDelete(event); setShowConfirmation(true); }}><Trash2 size={16} /></button>
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
          <div className="settings-container">
             <div className="settings-grid">
               <div className="settings-card">
                 <h3><User size={20} color="var(--primary)" /> Profile Details</h3>
                 <form onSubmit={handleUpdateProfile}>
                   <div className="form-group">
                     <label>Full Name</label>
                     <div className="input-with-icon">
                       <User size={18} className="field-icon" />
                       <input
                         type="text"
                         value={settingsForm.name}
                         onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})}
                       />
                     </div>
                   </div>
                   <div className="form-group">
                     <label>Work Email</label>
                     <div className="input-with-icon">
                       <Mail size={18} className="field-icon" />
                       <input
                         type="email"
                         value={settingsForm.email}
                         onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})}
                       />
                     </div>
                   </div>
                   <button type="submit" className="btn-primary" disabled={settingsLoading} style={{ width: '100%', justifyContent: 'center' }}>
                     {settingsLoading ? 'Updating...' : 'Save Changes'}
                   </button>
                 </form>
               </div>

               <div className="settings-card">
                 <h3><Shield size={20} color="var(--primary)" /> Security</h3>
                 <form onSubmit={handleChangePassword}>
                   <div className="form-group">
                     <label>Current Password</label>
                     <div className="input-with-icon">
                       <Lock size={18} className="field-icon" />
                       <input
                         type={showCurrentPassword ? "text" : "password"}
                         value={settingsForm.currentPassword}
                         onChange={(e) => setSettingsForm({...settingsForm, currentPassword: e.target.value})}
                       />
                       <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                         {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                       </button>
                     </div>
                   </div>
                   <div className="form-group">
                     <label>New Password</label>
                     <div className="input-with-icon">
                       <Lock size={18} className="field-icon" />
                       <input
                         type={showNewPassword ? "text" : "password"}
                         value={settingsForm.newPassword}
                         onChange={(e) => setSettingsForm({...settingsForm, newPassword: e.target.value})}
                       />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                         {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                       </button>
                     </div>
                   </div>
                   <button type="submit" className="btn-primary" disabled={settingsLoading} style={{ width: '100%', justifyContent: 'center' }}>
                     {settingsLoading ? 'Saving...' : 'Update Password'}
                   </button>
                 </form>
               </div>
             </div>
             {settingsSuccess && <div style={{ color: 'var(--success)', marginTop: '20px', fontWeight: '600' }}>{settingsSuccess}</div>}
             {settingsError && <div style={{ color: 'var(--accent)', marginTop: '20px', fontWeight: '600' }}>{settingsError}</div>}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content">
             <div className="modal-icon-box">
                <Trash2 color="var(--accent)" size={32} />
             </div>
             <h2 className="modal-title">Delete Event?</h2>
             <p className="modal-text">This will permanently remove <strong>{eventToDelete?.title}</strong>. This action cannot be undone.</p>
             <div className="modal-actions">
               <button className="btn-cancel" onClick={() => { setShowConfirmation(false); setEventToDelete(null); }}>Cancel</button>
               <button className="btn-delete" onClick={confirmDelete}>Delete Now</button>
             </div>
          </div>
        </div>
      )}

            {/* Modals */}
            {showDetails && selectedEvent && (
                <EventDetailsModal
                    event={selectedEvent}
                    onClose={() => setShowDetails(false)}
                    onOpenScanner={handleOpenScanner}
                />
            )}

            {showScanner && selectedEvent && (
                <QRScannerModal
                    event={selectedEvent}
                    onClose={() => setShowScanner(false)}
                />
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
    padding: '20px 60px 40px',
    transition: 'all 0.3s ease',
  },
  toggleBtn: {
    display: 'none',
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
    backgroundColor: '#eff6ff',
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
    borderColor: '#0b0f5b',
    backgroundColor: '#fff',
    boxShadow: '0 0 0 4px rgba(11, 15, 91, 0.1)',
  },
  premiumSubmitBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(180deg, #0b0f5b 0%, #0a0d4a 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(11, 15, 91, 0.2)',
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
    color: '#0b0f5b',
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
