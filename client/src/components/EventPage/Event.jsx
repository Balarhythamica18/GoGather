import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Event.css";

const Event = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    name: "",
    location: "",
    date: "",
    category: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    name: "",
    location: "",
    date: "",
    category: "",
  });

  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 12;

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/events")
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
  }, []);

  const processedEvents = useMemo(() => {
    return events
      .map((event) => {
        let source = "top";
        let isUpcoming = !!event.declaration;

        if (event.month && event.date) {
          try {
            const eventDate = new Date(`${event.month}-${event.date}`);
            const currentDate = new Date();
            const oneMonthLater = new Date(
              currentDate.getTime() + 30 * 24 * 60 * 60 * 1000
            );

            if (eventDate > oneMonthLater) {
              isUpcoming = true;
              source = "upcoming";
            }
          } catch (e) {
            console.error("Error parsing event date:", e);
          }
        }

        if (!isUpcoming) {
          if (event.category?.toLowerCase() === "comedy") {
            source = "comedy";
          }
        }

        return {
          ...event,
          source,
          isUpcoming,
        };
      })
      .filter((event) => {
        return (
          event.title
            .toLowerCase()
            .includes(appliedFilters.name.toLowerCase()) &&
          event.location
            .toLowerCase()
            .includes(appliedFilters.location.toLowerCase()) &&
          (appliedFilters.date === "" ||
            event.date === appliedFilters.date) &&
          (appliedFilters.category === "" ||
            event.category?.toLowerCase() ===
            appliedFilters.category.toLowerCase())
        );
      });
  }, [events, appliedFilters]);

  // ✅ Pagination Logic
  const totalPages = Math.ceil(processedEvents.length / eventsPerPage);

  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;

  const currentEvents = processedEvents.slice(
    indexOfFirstEvent,
    indexOfLastEvent
  );

  const handleApply = () => {
    setAppliedFilters(filters);
    setCurrentPage(1); // Reset to first page
    setIsFilterOpen(false);
  };

  const handleCancel = () => {
    setFilters(appliedFilters);
    setIsFilterOpen(false);
  };

  return (
    <div className="events-page">
      <div className="eventpage-header">
        <h1 className="events-title">All Events</h1>
        <button
          className="eventpage-filter-icon-btn"
          onClick={() => setIsFilterOpen(true)}
        >
          ☰ Filter
        </button>
      </div>

      <div className={`eventpage-filter-sidebar ${isFilterOpen ? "open" : ""}`}>
        <div className="eventpage-filter-header">
          <h2>Filter Events</h2>
          <button
            className="eventpage-close-btn"
            onClick={() => setIsFilterOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="eventpage-filter-body">
          <label>Event Name</label>
          <input
            type="text"
            value={filters.name}
            onChange={(e) =>
              setFilters({ ...filters, name: e.target.value })
            }
            placeholder="Search by name"
          />

          <label>Location</label>
          <input
            type="text"
            value={filters.location}
            onChange={(e) =>
              setFilters({ ...filters, location: e.target.value })
            }
            placeholder="Search by location"
          />

          <label>Date</label>
          <input
            type="text"
            value={filters.date}
            onChange={(e) =>
              setFilters({ ...filters, date: e.target.value })
            }
            placeholder="Enter date (e.g 25)"
          />

          <label>Category</label>
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          >
            <option value="">All Categories</option>
            <option value="Music">Music</option>
            <option value="Comedy">Comedy</option>
            <option value="Sports">Sports</option>
            <option value="Workshop">Workshop</option>
          </select>
        </div>

        <div className="eventpage-filter-footer">
          <button className="btn eventpage-cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn eventpage-apply-btn" onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div
          className="eventpage-overlay"
          onClick={() => setIsFilterOpen(false)}
        ></div>
      )}

      <div className="events-grid">
        {currentEvents.map((event) => (
          <div className="event-card" key={event._id}>
            {event.isUpcoming && (
              <span className="upcoming-badge">Upcoming</span>
            )}

            <img
              src={event.image}
              alt={event.title}
              className="event-image"
            />

            <div className="event-content">
              <div className="event-date-price">
                <span className="event-date">
                  {(() => {
                    try {
                      const dateObj = new Date(`${event.month}-${event.date}`);
                      const day = String(dateObj.getDate()).padStart(2, "0");
                      const monthName = dateObj.toLocaleDateString("en-US", {
                        month: "short",
                      });
                      const year = dateObj.getFullYear();
                      return `${day} ${monthName} ${year}`;
                    } catch (e) {
                      return `${event.date} ${event.month}`;
                    }
                  })()}
                </span>
                {event.price && (
                  <span className="event-price">{event.price}</span>
                )}
              </div>

              <h2 className="event-title">{event.title}</h2>
              <p className="event-description">{event.description}</p>

              <div className="event-meta">
                <span className="event-category">{event.category}</span>
                {event.time && (
                  <span className="event-time" style={{ fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⏰ {(() => {
                      const [hours, minutes] = event.time.split(":");
                      const h = parseInt(hours);
                      const ampm = h >= 12 ? "PM" : "AM";
                      const displayHours = h % 12 || 12;
                      return `${displayHours}:${minutes} ${ampm}`;
                    })()}
                  </span>
                )}
                <span className="event-location">
                  📍 {event.location}
                </span>
              </div>

              <div
                className={`event-buttons ${event.isUpcoming ? "center-details" : ""
                  }`}
              >
                {!event.isUpcoming && (
                  <button
                    className="btn book-btn"
                    onClick={() => navigate(`/seatlayout/${event._id}`)}
                  >
                    Book Now
                  </button>
                )}

                <button
                  className="btn details-btn"
                  onClick={() =>
                    navigate(`/events/${event.source || "top"}/${event._id}`)
                  }
                >
                  Details
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* ✅ Pagination UI */}
      {totalPages > 1 && (
        <div className="eventpage-pagination-wrapper">
          <button
            className="eventpage-pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ◀ Prev
          </button>

          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              className={`eventpage-pagination-number ${currentPage === index + 1 ? "active-page" : ""
                }`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}

          <button
            className="eventpage-pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default Event;
