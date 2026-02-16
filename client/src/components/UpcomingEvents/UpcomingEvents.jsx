import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UpcomingEvents.css";

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [visibleCount, setVisibleCount] = useState(4);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all events and filter for upcoming (date > 1 month away OR has declaration field)
    const fetchUpcoming = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/events");
        
        // Filter events that are upcoming: either have declaration field or date is > 1 month away
        const upcomingFiltered = res.data.filter((event) => {
          // If it has declaration field, it's marked as upcoming
          if (event.declaration) return true;

          // Check if date is more than 1 month away
          if (event.month && event.date) {
            try {
              // Parse month-date format (e.g., "2026-04" and "14")
              const eventDate = new Date(`${event.month}-${String(event.date).padStart(2, "0")}`);
              const currentDate = new Date();
              const oneMonthLater = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
              
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
              <img src={event.image} alt={event.title} />
              <div className="location-box">📍 {event.location}</div>
            </div>

            <div className="event-info">
              <div className="date-box">
                <div>{event.month}</div>
                <div>{event.date}</div>
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
          className="load-more"
          onClick={() => setVisibleCount((v) => v + 3)}
        >
          Load More
        </button>
      )}
    </div>
  );
};

export default UpcomingEvents;
