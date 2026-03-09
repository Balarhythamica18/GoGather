import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getImageUrl } from "../../utils/imageUtils";
import "./UpcomingEvents.css";

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/events`);

        const upcomingFiltered = res.data.filter((event) => {
          if (event.declaration) return true;

          if (event.month && event.date) {
            try {
              const eventDate = new Date(`${event.month}-${String(event.date).padStart(2, "0")}T00:00:00`);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const sixteenDaysLater = new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000);
              const fortyFiveDaysLater = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);

              // Only show events between 16 and 45 days from now
              return eventDate >= sixteenDaysLater && eventDate <= fortyFiveDaysLater;
            } catch (e) {
              console.error("Error parsing event date:", e);
              return false;
            }
          }
          return false;
        }).sort((a, b) => {
          const dateA = new Date(`${a.month}-${String(a.date).padStart(2, "0")}T00:00:00`);
          const dateB = new Date(`${b.month}-${String(b.date).padStart(2, "0")}T00:00:00`);
          return dateA - dateB;
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
          <article key={event._id} className="card">
            <div className="card__image">
              <img
                src={getImageUrl(event.image)}
                alt={event.title}
                onError={(e) => (e.target.src = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800")}
              />
              <div className="upcoming-badge">Upcoming</div>
            </div>

            <div className="card__body">
              <h3 className="card__title">{event.title}</h3>
              <p className="card__desc">{event.description}</p>

              <div className="card__meta">
                <div className="meta-left">
                  <span className="loc">📍 {event.location}</span>
                  <span className="cat">{event.category}</span>
                </div>
                <div className="meta-right">
                  <span className="price">
                    {typeof event.price === 'string' && event.price.toLowerCase() === 'free'
                      ? "Free"
                      : `Rs.${event.price}`}
                  </span>
                </div>
              </div>

              <div className="card__actions">
                <button
                  className="btn btn--primary"
                  onClick={() => navigate(`/seats/upcoming/${event._id}`)}
                >
                  Book Now
                </button>
                <button
                  className="btn btn--ghost"
                  onClick={() => navigate(`/events/upcoming/${event._id}`)}
                >
                  Details
                </button>
              </div>
            </div>
          </article>
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
