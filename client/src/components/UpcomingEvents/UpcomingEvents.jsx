import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getImageUrl } from "../../utils/imageUtils";
import Skeleton from "../ui/Skeleton";
import "./UpcomingEvents.css";

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
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

              const fortyFiveDaysLater = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);

              // ONLY show events that are MORE than 45 days away
              return eventDate > fortyFiveDaysLater;
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
      } finally {
        setLoading(false);
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
        {loading
          ? Array.from({ length: visibleCount }).map((_, index) => (
            <div key={`skeleton-${index}`} className="card">
              <div className="card__image">
                <Skeleton height="100%" borderRadius="0px" />
              </div>
              <div className="card__body">
                <Skeleton height="20px" width="80%" style={{ marginBottom: '10px' }} />
                <Skeleton height="14px" width="95%" style={{ marginBottom: '8px' }} />
                <Skeleton height="14px" width="60%" style={{ marginBottom: '20px' }} />
                <Skeleton height="36px" width="100%" borderRadius="12px" />
              </div>
            </div>
          ))
          : events.slice(0, visibleCount).map((event) => (
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

                <div className="card__actions">
                  <button
                    className="btn btn--ghost"
                    onClick={() => navigate(`/events/upcoming/${event._id}`)}
                    style={{ width: '100%' }}
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
