import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { allEvents } from "../../data/assets";
import "./EventDetailPage.css";

const EventDetailPage = () => {
  const { id, category } = useParams();
  const [isFav, setIsFav] = useState(false);
  const navigate = useNavigate();

  // ✅ Find event directly from master array
  const event = allEvents.find(
    (e) =>
      e.id === Number(id) &&
      (
        category === "upcoming"
          ? e.declaration
          : category === "comedy"
          ? e.category?.toLowerCase() === "comedy"
          : category === "top"
          ? !e.declaration &&
            e.category?.toLowerCase() !== "comedy"
          : true
      )
  );

  const isUpcoming = category === "upcoming";

  if (!event) return <h2>Event Not Found</h2>;

  return (
    <div className="edp-wrapper">
      {/* LEFT SIDE */}
      <div className="edp-left">
        {/* Image */}
        <div className="edp-image-box">
          <img src={event.image} alt={event.title} />
        </div>

        {/* About Section */}
        {event.aboutEvent && (
          <div className="edp-section">
            <h2>About the Event</h2>
            <p>{event.aboutEvent}</p>
          </div>
        )}

        {/* Highlights */}
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

        {/* Organizer */}
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

      {/* RIGHT SIDE */}
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

            {/* Price or Upcoming Badge */}
            {isUpcoming ? (
              <span className="edp-upcoming-badge">Upcoming</span>
            ) : (
              <div className="edp-price">
                <strong>Price:</strong>
                <span className="edp-price-value">
                  {event.price}
                </span>
                <span className="edp-onwards">onwards</span>
              </div>
            )}
          </div>

          <p className="edp-description">
            {event.description}
          </p>

          {/* Actions hidden for upcoming */}
          {!isUpcoming && (
            <div className="edp-actions">
              <button
                className="edp-book-btn"
                onClick={() =>
                  navigate(`/seats/${category}/${id}`)
                }
              >
                Book Now
              </button>

              <button
                className={`edp-fav-btn ${
                  isFav ? "active" : ""
                }`}
                onClick={() => setIsFav(!isFav)}
                aria-label="Add to favourites"
              >
                {isFav ? "❤️" : "🤍"}
              </button>
            </div>
          )}

          {event.declaration && (
            <p className="edp-declaration">
              {event.declaration}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
