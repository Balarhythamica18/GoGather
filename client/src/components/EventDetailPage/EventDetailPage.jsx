import React, { useState } from "react";
import { useParams } from "react-router-dom";
import upcoming from "../../data/events.json";
import top from "../../data/topevent.json";
import comedy from "../../data/comedy.json";
import "./EventDetailPage.css";
import { useNavigate } from "react-router-dom";

const EventDetailPage = () => {
  const { id, category } = useParams();
  const [isFav, setIsFav] = useState(false);

  const isUpcoming = category === "upcoming";

  const navigate = useNavigate();

  let data = [];
  if (category === "upcoming") data = upcoming;
  if (category === "top") data = top;
  if (category === "comedy") data = comedy;

  const event = data.find(e => e.id === Number(id));

  if (!event) return <h2>Event Not Found</h2>;

  return (
    <div className="edp-wrapper">
      {/* LEFT SIDE */}
      <div className="edp-left">
        {/* Image */}
        <div className="edp-image-box">
          <img src={event.image} alt={event.title} />
        </div>

        {/* BELOW IMAGE CONTENT */}
        {event.aboutEvent && (
          <div className="edp-section">
            <h2>About the Event</h2>
            <p>{event.aboutEvent}</p>
          </div>
        )}

        {event.keyHighlights && (
          <div className="edp-section">
            <h2>Key Highlights</h2>
            <ul className="edp-highlights">
              {event.keyHighlights.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {event.organizerDetails && (
          <div className="edp-section">
            <h2>Organizer</h2>
            <p className="edp-org-name">
              {event.organizerDetails.name}
            </p>
            <p>{event.organizerDetails.description}</p>
            <p>
              <strong>Email:</strong>{" "}
              {event.organizerDetails.contactEmail}
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              {event.organizerDetails.contactPhone}
            </p>
          </div>
        )}
      </div>

      {/* RIGHT SIDE - STICKY INFO BOX */}
      <div className="edp-right">
        <div className="edp-sticky-box">
          <h1 className="edp-title">{event.title}</h1>

          <div className="edp-info">
            <p>
              <strong>Date:</strong> {event.date} {event.month}
            </p>
            <p>
              <strong>Location:</strong> {event.location}
            </p>
            <p>
              <strong>Category:</strong> {event.category}
            </p>

            {/* PRICE OR UPCOMING BADGE */}
           {/* PRICE OR UPCOMING BADGE */}
{isUpcoming ? (
  <span className="edp-upcoming-badge">Upcoming</span>
) : (
  <div className="edp-price">
    <strong>Price:</strong>
    <span className="edp-price-value">{event.price}</span>
    <span className="edp-onwards">onwards</span>
  </div>
)}
          </div>
          <p className="edp-description">{event.description}</p>

          {/* ACTIONS - HIDDEN FOR UPCOMING */}
          {!isUpcoming && (
            <div className="edp-actions">
              <button
  className="edp-book-btn"
  onClick={() => navigate(`/seats/${category}/${id}`)}
>
  Book Now
</button>

              <button
                className={`edp-fav-btn ${isFav ? "active" : ""}`}
                onClick={() => setIsFav(!isFav)}
                aria-label="Add to favourites"
              >
                {isFav ? "❤️" : "🤍"}
              </button>
            </div>
          )}

          {event.declaration && (
            <p className="edp-declaration">{event.declaration}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;