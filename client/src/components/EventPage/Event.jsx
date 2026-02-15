import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Event.css";

const Event = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/events")
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
  }, []);

  const processedEvents = useMemo(() => {
    return events.map((event) => {
      let source = "top";
      let isUpcoming = !!event.declaration;

      // Check if event date is more than 1 month away
      if (event.month && event.date) {
        try {
          const eventDate = new Date(`${event.month}-${event.date}`);
          const currentDate = new Date();
          const oneMonthLater = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          
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
    });
  }, [events]);

  return (
    <div className="events-page">
      <h1 className="events-title">All Events</h1>
      <div className="events-grid">
        {processedEvents.map((event) => (
          <div className="event-card" key={event._id}>
            {event.isUpcoming && <span className="upcoming-badge">Upcoming</span>}

            <img src={event.image} alt={event.title} className="event-image" />

            <div className="event-content">
              <div className="event-date-price">
                <span className="event-date">
                  {event.month} {event.date}
                </span>
                {event.price && (
                  <div className="event-price-wrap">
                    <span className="event-price">{event.price}</span>
                  </div>
                )}
              </div>

              <h2 className="event-title">{event.title}</h2>
              <p className="event-description">{event.description}</p>

              <div className="event-meta">
                <span className="event-category">{event.category}</span>
                <span className="event-location">📍 {event.location}</span>
              </div>

              <div className="event-buttons">
                <button className="btn book-btn">Book Now</button>
                <button
                  className="btn btn--ghost"
                  onClick={() => navigate(`/events/${event.source || event.category || 'top'}/${event._id}`)}
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
