import React from "react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "../../context/FavoritesContext";
import "./Favorite.css";

const Favorite = () => {
  const { favorites, removeFavorite } = useFavorites();
  const navigate = useNavigate();

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHours = h % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  if (favorites.length === 0) {
    return (
      <div className="favorite-empty">
        <h2>No favorite events yet ❤️</h2>
        <p>Start exploring and add some events to your favorites!</p>
        <button className="favorite-book-btn" onClick={() => navigate("/events")}>
          Explore Events
        </button>
      </div>
    );
  }

  return (
    <div className="favorite-page">
      <h1>My Favorites</h1>

      <div className="favorites-grid">
        {favorites.map((event) => (
          <div key={event.id} className="favorite-card">
            <div className="favorite-image-container">
              <img
                src={event.image}
                alt={event.title}
                onClick={() => navigate(`/events/${event.category || 'all'}/${event.id}`)}
                style={{ cursor: 'pointer' }}
              />
              <button
                className="remove-fav-btn"
                onClick={() => removeFavorite(event.id)}
                title="Remove from favorites"
              >
                ✕
              </button>
            </div>

            <div className="favorite-details">
              <h3 onClick={() => navigate(`/events/${event.category || 'all'}/${event.id}`)} style={{ cursor: 'pointer' }}>
                {event.title}
              </h3>
              <p className="favorite-location">📍 {event.location}</p>
              {event.time && <p className="favorite-time">⏰ {formatTime(event.time)}</p>}
              <div className="favorite-footer">
                <span className="favorite-price">{event.price}</span>
                <button
                  className="favorite-book-btn"
                  onClick={() => navigate(`/events/${event.category || 'all'}/${event.id}`)}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorite;
