import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { upcomingEvents } from "../../data/assets"; 
import "./UpcomingEvents.css";

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [visibleCount, setVisibleCount] = useState(4);
  const navigate = useNavigate();

  useEffect(() => {
    setEvents(upcomingEvents); // ✅ upcoming only
  }, []);

  const handleClick = (id) => {
    navigate(`/event/upcoming/${id}`);
  };

  return (
    <div className="upcoming-container">
      <h2 className="upcoming-title">Upcoming Events</h2>

      <div className="events-grid">
        {events.slice(0, visibleCount).map((event) => (
          <div
            key={event.id}
            className="event-card"
            onClick={() => handleClick(event.id)}
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
