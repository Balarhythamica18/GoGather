import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getImageUrl } from "../../utils/imageUtils";
import "./EventDetailPage.css";
import { useFavorites } from "../../context/FavoritesContext";
import { Heart } from "lucide-react";
import RecommendedEvents from "./RecommendedEvents";
import Skeleton from "../ui/Skeleton";

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
      .get(`${API_BASE_URL}/api/events/${id}`)
      .then((res) => setEvent(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!event) return (
    <div className="edp-wrapper" style={{ minHeight: '80vh' }}>
      <div className="edp-left">
        <div className="edp-image-box">
          <Skeleton height="400px" borderRadius="20px" />
        </div>
        <div className="edp-section" style={{ marginTop: '30px' }}>
          <Skeleton width="40%" height="32px" style={{ marginBottom: '20px' }} />
          <Skeleton width="100%" height="20px" style={{ marginBottom: '10px' }} />
          <Skeleton width="100%" height="20px" style={{ marginBottom: '10px' }} />
          <Skeleton width="80%" height="20px" />
        </div>
        <div className="edp-section">
          <Skeleton width="40%" height="32px" style={{ marginBottom: '20px' }} />
          <Skeleton width="60%" height="20px" style={{ marginBottom: '10px' }} />
          <Skeleton width="50%" height="20px" />
        </div>
      </div>
      <div className="edp-right">
        <div className="edp-sticky-box" style={{ background: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
          <Skeleton width="80%" height="40px" style={{ marginBottom: '30px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
            <Skeleton width="60%" height="24px" />
            <Skeleton width="70%" height="24px" />
            <Skeleton width="50%" height="24px" />
            <Skeleton width="65%" height="24px" />
          </div>
          <Skeleton width="40%" height="32px" style={{ marginBottom: '20px', marginTop: '30px' }} />
          <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
            <Skeleton width="80%" height="56px" borderRadius="16px" style={{ flex: 1 }} />
            <Skeleton width="56px" height="56px" borderRadius="16px" />
          </div>
        </div>
      </div>
    </div>
  );

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

  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800";
    e.target.onerror = null;
  };

  return (
    <>
      <div className="edp-wrapper">
        <div className="edp-left">
          <div className="edp-image-box">
            <img
              src={getImageUrl(event.image)}
              alt={event.title}
              onError={handleImageError}
            />
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

          {event.refundPolicy && (
            <div className="edp-section">
              <h2>Refund Policy</h2>
              <p>{event.refundPolicy}</p>
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
              <div className="edp-actions-row">
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
                    fill={isFavorite(id) ? "#0b0f5b" : "none"}
                    color={isFavorite(id) ? "#0b0f5b" : "#666"}
                  />
                </button>
              </div>
            )}

            {event.declaration && (
              <p className="edp-declaration">{event.declaration}</p>
            )}
            {event.declaration && (
              <p className="edp-declaration">{event.declaration}</p>
            )}
          </div>
        </div>
      </div>
      <RecommendedEvents currentEventId={id} currentCategory={event.category} />
    </>
  );
};

export default EventDetailPage;
