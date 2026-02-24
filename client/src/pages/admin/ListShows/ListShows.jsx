import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ListShows.css';
import { FiSearch, FiFilter, FiX, FiCalendar, FiMapPin, FiTag, FiDollarSign } from 'react-icons/fi';
import { Activity } from 'lucide-react';

const ListShows = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    eventName: '',
    organizerName: '',
    location: '',
    date: '',
    category: '',
    minPrice: '',
    maxPrice: ''
  });

  const fetchEvents = async (queryParams = {}) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/events", {
        headers: { Authorization: `Bearer ${token}` },
        params: queryParams
      });
      setEvents(res.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchEvents({ q: value });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchEvents(filters);
    setShowSidebar(false);
  };

  const resetFilters = () => {
    const initial = {
      eventName: '',
      organizerName: '',
      location: '',
      date: '',
      category: '',
      minPrice: '',
      maxPrice: ''
    };
    setFilters(initial);
    fetchEvents(initial);
    setShowSidebar(false);
  };

  return (
    <div className="listshows">
      <header style={styles.header}>
        <div>
          <h1 className="admin-dashboard__title">Event Management</h1>
          <p className="admin-dashboard__subtitle">Browse and filter all platform events</p>
        </div>

        <div style={styles.actionGroup}>
          <div className="search-box" style={styles.searchBox}>
            <FiSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by title, location..."
              value={search}
              onChange={handleSearch}
              style={styles.searchInput}
            />
          </div>
          <button className="filter-btn" onClick={() => setShowSidebar(true)} style={styles.filterBtn}>
            <FiFilter />
            <span>Advanced Filters</span>
          </button>
        </div>
      </header>

      {/* Filter Sidebar */}
      <div className={`filter-sidebar ${showSidebar ? 'active' : ''}`} style={{
        ...styles.sidebar,
        transform: showSidebar ? 'translateX(0)' : 'translateX(100%)'
      }}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>Filter Parameters</h3>
          <button style={styles.closeBtn} onClick={() => setShowSidebar(false)}>
            <FiX size={20} />
          </button>
        </div>

        <div style={styles.sidebarContent}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Event Title</label>
            <input type="text" name="eventName" value={filters.eventName} onChange={handleFilterChange} placeholder="Enter title" style={styles.input} />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Organizer</label>
            <input type="text" name="organizerName" value={filters.organizerName} onChange={handleFilterChange} placeholder="Enter name" style={styles.input} />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Location</label>
            <input type="text" name="location" value={filters.location} onChange={handleFilterChange} placeholder="Enter location" style={styles.input} />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange} style={styles.input}>
              <option value="">All Categories</option>
              <option value="Comedy">Comedy</option>
              <option value="Music">Music</option>
              <option value="Art">Art</option>
              <option value="Sports">Sports</option>
              <option value="Food">Food</option>
            </select>
          </div>
        </div>

        <div style={styles.sidebarFooter}>
          <button style={styles.resetBtn} onClick={resetFilters}>Reset All</button>
          <button style={styles.okBtn} onClick={applyFilters}>Apply Filters</button>
        </div>
      </div>

      {showSidebar && <div style={styles.overlay} onClick={() => setShowSidebar(false)}></div>}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Event Details</th>
              <th>Organizer</th>
              <th>Category</th>
              <th>Pricing</th>
              <th>Schedule</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '100px' }}>
                  <Activity className="animate-spin" style={{ margin: '0 auto 16px auto', color: '#ff007a' }} />
                  <p style={{ color: '#64748b' }}>Refreshing event list...</p>
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>No events match your criteria.</td></tr>
            ) : (
              events.map((event) => (
                <tr key={event._id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '800', color: '#1e293b' }}>{event.title}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiMapPin size={10} /> {event.location}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600' }}>{event.organizer?.name || 'Unknown'}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{event.organizer?.email || ''}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#475569'
                    }}>
                      {event.category}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '700', color: '#ff007a' }}>{event.price === 'Free' ? 'Free' : `₹${event.price}`}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiCalendar size={14} />
                      {event.month} {event.date}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  actionGroup: {
    display: 'flex',
    gap: '12px',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94a3b8',
  },
  searchInput: {
    padding: '10px 12px 10px 36px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    width: '280px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  filterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '320px',
    height: '100vh',
    backgroundColor: '#fff',
    zIndex: 2000,
    boxShadow: '-10px 0 30px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s ease-in-out',
  },
  sidebarHeader: {
    padding: '24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  sidebarContent: {
    padding: '24px',
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#64748b',
  },
  input: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
  },
  sidebarFooter: {
    padding: '24px',
    borderTop: '1px solid #f1f5f9',
    background: '#f8fafc',
    display: 'flex',
    gap: '12px',
  },
  resetBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    color: '#64748b',
    fontWeight: '600',
    cursor: 'pointer',
  },
  okBtn: {
    flex: 2,
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#ff007a',
    color: '#fff',
    fontWeight: '700',
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)',
    zIndex: 1999,
  }
};

export default ListShows;
