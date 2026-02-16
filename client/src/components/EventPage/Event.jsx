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

  const handleApply = () => {
    setAppliedFilters(filters);
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
        {processedEvents.map((event) => (
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
                  {event.month} {event.date}
                </span>
                {event.price && (
                  <span className="event-price">{event.price}</span>
                )}
              </div>

              <h2 className="event-title">{event.title}</h2>
              <p className="event-description">
                {event.description}
              </p>

              <div className="event-meta">
                <span className="event-category">
                  {event.category}
                </span>
                <span className="event-location">
                  📍 {event.location}
                </span>
              </div>

              <div className="event-buttons">
                <button className="btn book-btn">
                  Book Now
                </button>
                <button
                  className="btn details-btn"
                  onClick={() =>
                    navigate(
                      `/events/${event.source || "top"}/${event._id}`
                    )
                  }
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Event;
