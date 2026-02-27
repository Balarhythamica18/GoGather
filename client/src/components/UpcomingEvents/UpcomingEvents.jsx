import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getImageUrl } from "../../utils/imageUtils";
import "./UpcomingEvents.css";

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [visibleCount, setVisibleCount] = useState(4);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/events`);

        const upcomingFiltered = res.data.filter((event) => {
          if (event.declaration) return true;

          if (event.month && event.date) {
            try {
              const eventDate = new Date(
                `${event.month}-${String(event.date).padStart(2, "0")}`
              );
              const currentDate = new Date();
              const oneMonthLater = new Date(
                currentDate.getTime() + 45 * 24 * 60 * 60 * 1000
              );

              return eventDate > oneMonthLater;
            } catch (e) {
              console.error("Error parsing event date:", e);
              return false;
            }
          }

          return false;
        });

        setEvents(upcomingFiltered);
      } catch (err) {
        console.error("Error fetching upcoming events:", err);
      }
    };

    fetchUpcoming();
  }, []);

  const handleClick = (id) => {
    navigate(`/events/upcoming/${id}`);
  };

  /* ===== FORMAT MONTH FUNCTION ===== */
  const formatMonth = (monthValue) => {
    if (!monthValue) return "";

    try {
      // If month is like "2026-04"
      const date = new Date(`${monthValue}-01`);
      return date.toLocaleString("en-US", { month: "short" });
    } catch {
      return monthValue;
    }
  };

  return (
    <div className="upcoming-container">
      <h2 className="upcoming-title">Upcoming Events</h2>

      <div className="events-grid">
        {events.slice(0, visibleCount).map((event) => (
          <div
            key={event._id}
            className="event-card"
            onClick={() => handleClick(event._id)}
          >
            <div className="event-img">
              <div className="upcoming-badge">Upcoming</div>
              <img src={getImageUrl(event.image)} alt={event.title} />
              <div className="location-box">📍 {event.location}</div>
            </div>

            <div className="event-info">
              <div className="date-box">
                <div className="month-text">
                  {formatMonth(event.month)}
                </div>
                <div className="date-text">
                  {event.date}
                </div>
              </div>

              <div className="title-desc">
                <div className="event-title">{event.title}</div>
                <div className="event-desc">{event.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {visibleCount < events.length && (
        <button
          className="upcoming-load-more"
          onClick={() => setVisibleCount((v) => v + 3)}
        >
          Load More
        </button>
      )}
    </div>
  );
};

export default UpcomingEvents;
