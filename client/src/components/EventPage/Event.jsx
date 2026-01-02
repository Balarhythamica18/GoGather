import React from "react";
import { useNavigate } from "react-router-dom";
import "./Event.css";

import comedy from "../../data/comedy.json";
import upcoming from "../../data/events.json";
import topEvents from "../../data/topevent.json";


const comedyTagged = comedy.map(e => ({ ...e, source: "comedy" }));
const upcomingTagged = upcoming.map(e => ({
  ...e,
  source: "upcoming",
  isUpcoming: true,
}));
const topTagged = topEvents.map(e => ({ ...e, source: "top" }));

const allEventsRaw = [...comedyTagged, ...upcomingTagged, ...topTagged];

const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);
const allEvents = shuffleArray(allEventsRaw);

const Event = () => {
  const navigate = useNavigate();

  return (
    <div className="events-page">
      
      <h1 className="events-title">All Events</h1>

      <div className="events-grid">
        {allEvents.map((event) => (
          <div
            className="event-card"
            key={`${event.source}-${event.id}`}
          >
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
                  <div className="event-price-wrap">
                    <span className="event-price">
                      {event.price}
                    </span>
                  </div>
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
