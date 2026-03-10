import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getImageUrl } from "../../utils/imageUtils";
import "./EventDetailPage.css";
import { useFavorites } from "../../context/FavoritesContext";
import { Heart, Calendar, Clock, MapPin, Tag, Navigation, Building, Map, Info, FileText, CheckCircle2, LogIn } from "lucide-react";
import RecommendedEvents from "./RecommendedEvents";
import Skeleton from "../ui/Skeleton";
import toast from "react-hot-toast";

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
    <div className="edp-wrapper">
      <div className="edp-left">
        <div className="edp-image-box">
          <Skeleton height="420px" width="100%" />
        </div>
        <div className="edp-section">
          <h2><Skeleton width="140px" height="24px" /></h2>
          <Skeleton height="14px" width="100%" style={{ marginBottom: '10px' }} />
          <Skeleton height="14px" width="100%" style={{ marginBottom: '10px' }} />
          <Skeleton height="14px" width="60%" />
        </div>
        <div className="edp-section">
          <h2><Skeleton width="140px" height="24px" /></h2>
          <div className="edp-highlights-grid">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} height="36px" width="110px" borderRadius="100px" />)}
          </div>
        </div>
      </div>
      <div className="edp-right">
        <div className="edp-sticky-box">
          <Skeleton height="32px" width="85%" style={{ marginBottom: '24px' }} />
          <div className="edp-info">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="info-row">
                <Skeleton height="44px" width="44px" borderRadius="12px" />
                <div className="info-text-container">
                  <Skeleton height="10px" width="40px" style={{ marginBottom: '6px' }} />
                  <Skeleton height="16px" width="120px" />
                </div>
              </div>
            ))}
          </div>
          <div className="edp-actions-row">
            <Skeleton height="56px" style={{ flex: 1 }} borderRadius="14px" />
            <Skeleton height="56px" width="56px" borderRadius="14px" />
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
              <div className="edp-highlights-grid">
                {event.keyHighlights.map((item, i) => (
                  <span className="edp-highlight-tag" key={i}>
                    <CheckCircle2 size={16} className="text-blue-500" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {event.sessions && event.sessions.length > 0 && (
            <div className="edp-section">
              <h2>Event Sessions</h2>
              <div className="edp-sessions-list">
                {event.sessions.map((session, i) => (
                  <div key={i} className="edp-session-card">
                    <div className="session-time">
                      <span>{formatTime(session.startTime)}</span>
                      <div className="time-divider"></div>
                      <span>{formatTime(session.endTime)}</span>
                    </div>
                    <div className="session-info">
                      <h3>{session.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.instructions && (
            <div className="edp-section instructions-section">
              <h2><Info size={24} className="section-icon" /> Important Instructions</h2>
              <div className="edp-instructions-box">
                <p>{event.instructions}</p>
              </div>
            </div>
          )}

          {event.organizerDetails && (
            <div className="edp-section">
              <h2>Organizer</h2>
              <div className="edp-organizer-profile">
                <div>
                  <p className="edp-org-name">{event.organizerDetails.name}</p>
                  <p className="org-desc">{event.organizerDetails.description}</p>
                </div>
                <div className="org-contact-grid">
                  {event.organizerDetails.contactEmail && (
                    <span className="contact-item">✉️ {event.organizerDetails.contactEmail}</span>
                  )}
                  {event.organizerDetails.contactPhone && (
                    <span className="contact-item">📞 {event.organizerDetails.contactPhone}</span>
                  )}
                </div>
              </div>
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
              <div className="info-row">
                <Calendar className="section-icon" size={20} />
                <div className="info-text-container">
                  <span className="info-label">Date</span>
                  <span className="info-value">{event.date} {event.month}</span>
                </div>
              </div>

              {event.time && (
                <div className="info-row">
                  <Clock className="section-icon" size={20} />
                  <div className="info-text-container">
                    <span className="info-label">Time</span>
                    <span className="info-value">{formatTime(event.time)}</span>
                  </div>
                </div>
              )}

              <div className="info-row">
                <Navigation className="section-icon" size={20} />
                <div className="info-text-container">
                  <span className="info-label">Location</span>
                  <span className="info-value">{event.location}</span>
                </div>
              </div>

              {event.address && (
                <div className="info-row">
                  <Building className="section-icon" size={20} />
                  <div className="info-text-container">
                    <span className="info-label">Address</span>
                    <span className="info-value">{event.address}</span>
                  </div>
                </div>
              )}

              {event.mapLink && (
                <a href={event.mapLink} target="_blank" rel="noopener noreferrer" className="info-row" style={{ textDecoration: 'none' }}>
                  <Map className="section-icon" size={20} />
                  <div className="info-text-container">
                    <span className="info-label">Google Maps</span>
                    <span className="info-value" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>View Direction &rarr;</span>
                  </div>
                </a>
              )}

              <div className="info-row">
                <Tag className="section-icon" size={20} />
                <div className="info-text-container">
                  <span className="info-label">Category</span>
                  <span className="info-value">{event.category}</span>
                </div>
              </div>

              {isUpcoming ? (
                <span className="edp-upcoming-badge">Upcoming</span>
              ) : (
                <div className="price-ticket-section">
                  <div className="edp-price-container">
                    <span className="info-label">Price</span>
                    <span className="edp-price-value">
                      {typeof event.price === 'string' && event.price.toLowerCase() === 'free'
                        ? "Free"
                        : `₹${event.price}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <p className="edp-description">{event.description}</p>

            {!isUpcoming && (
              <div className="edp-actions-row">
                <button
                  className="edp-book-btn"
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    if (!token) {
                      toast((t) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            padding: '8px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <LogIn size={20} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Login Required</p>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Please login to continue booking.</p>
                          </div>
                          <button
                            onClick={() => {
                              toast.dismiss(t.id);
                              navigate("/login");
                            }}
                            style={{
                              background: '#1e293b',
                              color: 'white',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            Login
                          </button>
                        </div>
                      ), {
                        duration: 4000,
                        position: 'top-center',
                        style: {
                          minWidth: '350px',
                          borderRadius: '16px',
                          background: '#ffffff',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                          padding: '16px',
                        },
                      });
                      return;
                    }
                    navigate(`/seats/${category}/${id}`);
                  }}
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

            {event.brochure && (
              <div style={{ marginTop: '4px' }}>
                <a
                  href={getImageUrl(event.brochure)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="edp-brochure-link"
                >
                  <FileText size={18} />
                  Download Complete Brochure
                </a>
              </div>
            )}

            {event.declaration && (
              <p className="edp-declaration-box">
                <Info size={18} />
                <p>{event.declaration}</p>
              </p>
            )}
          </div>
        </div>
      </div>
      <RecommendedEvents currentEventId={id} currentCategory={event.category} />
    </>
  );
};

export default EventDetailPage;
