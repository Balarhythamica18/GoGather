import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { allEvents } from "../../data/assets";
import "./Event.css";

const Event = () => {
  const navigate = useNavigate();

  // ✅ Add dynamic source + upcoming flag
  const processedEvents = useMemo(() => {
    return allEvents.map((event) => {
      let source = "top";

      if (event.declaration) {
        source = "upcoming";
      } else if (
        event.category?.toLowerCase() === "comedy"
      ) {
        source = "comedy";
      }

      return {
        ...event,
        source,
        isUpcoming: !!event.declaration,
      };
    });
  }, []);

  // ✅ Shuffle once
  const shuffledEvents = useMemo(() => {
    return [...processedEvents].sort(
      () => Math.random() - 0.5
    );
  }, [processedEvents]);

  return (
    <div className="events-page">
      <h1 className="events-title">All Events</h1>

      <div className="events-grid">
        {shuffledEvents.map((event) => (
          <div
            className="event-card"
            key={`${event.source}-${event.id}`}
          >
            {event.isUpcoming && (
              <span className="upcoming-badge">
                Upcoming
              </span>
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

                {!event.isUpcoming && event.price && (
                  <div className="event-price-wrap">
                    <span className="event-price">
                      {event.price}
                    </span>
                  </div>
                )}
              </div>

              <h2 className="event-title">
                {event.title}
              </h2>

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
                {!event.isUpcoming && (
                  <button className="btn book-btn">
                    Book Now
                  </button>
                )}

                <button
                  className="btn btn--ghost"
                  onClick={() =>
                    navigate(
                      `/events/${event.source}/${event.id}`
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
