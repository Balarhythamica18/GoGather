import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EventDetailPage.css";
import { useFavorites } from "../../context/FavoritesContext";
import { Heart } from "lucide-react";

const EventDetailPage = () => {
  const { id, category } = useParams();
  const [event, setEvent] = useState(null);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHours = h % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/events/${id}`)
      .then((res) => setEvent(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!event) return <h2>Loading...</h2>;

  const isUpcoming = (() => {
    if (category === "upcoming" || !!event.declaration) return true;
    if (event.month && event.date) {
      try {
        const eventDate = new Date(`${event.month}-${String(event.date).padStart(2, "0")}`);
        const currentDate = new Date();
        const tenDaysLater = new Date(currentDate.getTime() + 45 * 24 * 60 * 60 * 1000);
        return eventDate > tenDaysLater;
      } catch (e) {
        console.error("Error parsing event date:", e);
      }
    }
    return false;
  })();

  return (
    <div className="edp-wrapper">
      <div className="edp-left">
        <div className="edp-image-box">
          <img src={event.image} alt={event.title} />
        </div>

        {event.aboutEvent && (
          <div className="edp-section">
            <h2>About the Event</h2>
            <p>{event.aboutEvent}</p>
          </div>
        )}

        {event.keyHighlights && event.keyHighlights.length > 0 && (
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
            <p className="edp-org-name">{event.organizerDetails.name}</p>
            <p>{event.organizerDetails.description}</p>
            <p>
              <strong>Email:</strong> {event.organizerDetails.contactEmail}
            </p>
            <p>
              <strong>Phone:</strong> {event.organizerDetails.contactPhone}
            </p>
          </div>
        )}
      </div>

      <div className="edp-right">
        <div className="edp-sticky-box">
          <h1 className="edp-title">{event.title}</h1>

          <div className="edp-info">
            <p>
              <strong>Date:</strong> {event.date} {event.month}
            </p>
            {event.time && (
              <p>
                <strong>Time:</strong> {formatTime(event.time)}
              </p>
            )}
            <p>
              <strong>Location:</strong> {event.location}
            </p>
            {event.address && (
              <p>
                <strong>Address:</strong> {event.address}
              </p>
            )}
            <p>
              <strong>Category:</strong> {event.category}
            </p>

            {isUpcoming ? (
              <span className="edp-upcoming-badge">Upcoming</span>
            ) : (
              <div className="edp-price">
                <strong>Price:</strong>
                <span className="edp-price-value">
                  {typeof event.price === 'string' && event.price.toLowerCase() === 'free'
                    ? " Free"
                    : ` Rs.${event.price}`}
                </span>

              </div>
            )}
          </div>

          <p className="edp-description">{event.description}</p>

          {!isUpcoming && (
            <div className="edp-actions">
              <button
                className="edp-book-btn"
                onClick={() => navigate(`/seats/${category}/${id}`)}
              >
                Book Now
              </button>

              <button
                className={`edp-fav-btn ${isFavorite(id) ? "active" : ""}`}
                onClick={() =>
                  isFavorite(id)
                    ? removeFavorite(id)
                    : addFavorite({
                      id: event._id,
                      title: event.title,
                      image: event.image,
                      price: event.price,
                      location: event.location,
                      category: category
                    })
                }
                aria-label="Add to favourites"
              >
                <Heart
                  size={24}
                  fill={isFavorite(id) ? "#ff007a" : "none"}
                  color={isFavorite(id) ? "#ff007a" : "#666"}
                />
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
