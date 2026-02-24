import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Title from '../../../components/Admin/Title'
import './ListShows.css'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'

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
      setLoading(false);
    } catch (error) {
      console.error("Error fetching events:", error);
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
      <div className="listshows-header">
        <Title text1="Admin" text2="List Shows" />

        <div className="search-filter-container">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={handleSearch}
            />
          </div>
          <button className="filter-btn" onClick={() => setShowSidebar(true)}>
            <FiFilter />
          </button>
        </div>
      </div>

      {/* Filter Sidebar */}
      <div className={`filter-sidebar ${showSidebar ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h3>Filter Options</h3>
          <button className="close-btn" onClick={() => setShowSidebar(false)}>
            <FiX />
          </button>
        </div>

        <div className="sidebar-content">
          <div className="filter-group">
            <label>Event Name</label>
            <input type="text" name="eventName" value={filters.eventName} onChange={handleFilterChange} placeholder="Enter title" />
          </div>
          <div className="filter-group">
            <label>Organizer Name</label>
            <input type="text" name="organizerName" value={filters.organizerName} onChange={handleFilterChange} placeholder="Enter name" />
          </div>
          <div className="filter-group">
            <label>Location</label>
            <input type="text" name="location" value={filters.location} onChange={handleFilterChange} placeholder="Enter location" />
          </div>
          <div className="filter-group">
            <label>Date</label>
            <input type="text" name="date" value={filters.date} onChange={handleFilterChange} placeholder="e.g. 14 or March" />
          </div>
          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              <option value="Comedy">Comedy</option>
              <option value="Music">Music</option>
              <option value="Art">Art</option>
              <option value="Sports">Sports</option>
              <option value="Food">Food</option>
            </select>
          </div>
          <div className="filter-group price-range">
            <label>Price Range</label>
            <div className="range-inputs">
              <input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Min" />
              <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Max" />
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="reset-btn" onClick={resetFilters}>Reset</button>
          <button className="ok-btn" onClick={applyFilters}>OK</button>
        </div>
      </div>

      {showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)}></div>}

      <div className="table-container">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Organizer</th>
                <th>Category</th>
                <th>Location</th>
                <th>Price</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading events...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No events found</td></tr>
              ) : (
                events.map((event) => (
                  <tr key={event._id}>
                    <td>{event.title}</td>
                    <td>{event.organizer?.name || 'N/A'}</td>
                    <td>{event.category}</td>
                    <td>{event.location}</td>
                    <td>{event.price}</td>
                    <td>{event.date || event.month + ' ' + event.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ListShows;
