import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getImageUrl } from "../../utils/imageUtils";
import "./EventDetailPage.css";
import { useFavorites } from "../../context/FavoritesContext";
import RecommendedEvents from "./RecommendedEvents";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Tag, 
  FileText, 
  Info, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Heart,
  Share2
} from "lucide-react";

const EventDetailPage = () => {
  const { id, category } = useParams();
  const [event, setEvent] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();

  const formatDate = (monthStr, dateStr) => {
    if (!monthStr || !dateStr) return "";
    try {
      const [year, month] = monthStr.split("-");
      const dateObj = new Date(year, parseInt(month) - 1, dateStr);
      return dateObj.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return `${dateStr} ${monthStr}`;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHours = h % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Check out this event: ${event.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    console.log("Fetching event with ID:", id);
    axios
      .get(`${API_BASE_URL}/api/events/${id}`)
      .then((res) => {
        setEvent(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError(err.response?.data?.message || "Failed to load event details");
      });
  }, [id]);

  if (error) {
    return (
      <div className="edp-error-container">
        <h2>Oops! {error}</h2>
        <p>It seems this event is no longer available or was moved.</p>
        <button className="edp-book-btn" onClick={() => navigate("/events")}>Browse Other Events</button>
      </div>
    );
  }

  if (!event) return (
    <div className="edp-wrapper skeleton-state">
      <div className="edp-left">
        <div className="edp-image-box skeleton-block hero-skeleton"></div>
        <div className="edp-section">
          <div className="skeleton-title"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text short"></div>
        </div>
        <div className="edp-section">
          <div className="skeleton-title"></div>
          <div className="edp-highlights-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-tag"></div>)}
          </div>
        </div>
      </div>
      <div className="edp-right">
        <div className="edp-sticky-box">
          <div className="skeleton-main-title"></div>
          <div className="edp-info">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="info-row">
                <div className="skeleton-icon-box"></div>
                <div className="info-text-container">
                  <div className="skeleton-label"></div>
                  <div className="skeleton-value"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text short"></div>
          <div className="edp-actions-row">
            <div className="skeleton-btn main-btn"></div>
            <div className="skeleton-btn icon-btn"></div>
            <div className="skeleton-btn icon-btn"></div>
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

  return (
    <>
      <div className="edp-wrapper">
        <div className="edp-left">
          <div className="edp-image-box">
            <div className={`skeleton-block hero-skeleton ${imageLoaded ? "hidden" : ""}`} style={{ marginBottom: 0 }}></div>
            <img 
              src={getImageUrl(event.image)} 
              alt={event.title} 
              onLoad={() => setImageLoaded(true)}
              className={imageLoaded ? "loaded" : ""}
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
              <h2><Layers size={20} className="section-icon" /> Key Highlights</h2>
              <div className="edp-highlights-grid">
                {event.keyHighlights.map((item, i) => (
                  <div key={i} className="edp-highlight-tag">
                    <ShieldCheck size={14} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.sessions && event.sessions.length > 0 && (
            <div className="edp-section">
              <h2><Clock size={20} className="section-icon" /> Event Schedule</h2>
              <div className="edp-sessions-list">
                {event.sessions.map((session, i) => (
                  <div key={i} className="edp-session-card">
                    <div className="session-time">
                      <span>{session.startTime}</span>
                      <div className="time-divider"></div>
                      <span>{session.endTime}</span>
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
              <h2><Info size={20} className="section-icon" /> Special Instructions</h2>
              <div className="edp-instructions-box">
                <p>{event.instructions}</p>
              </div>
            </div>
          )}

          {event.organizerDetails && (
            <div className="edp-section organizer-section">
              <h2><User size={20} className="section-icon" /> Organizer Info</h2>
              <div className="edp-organizer-profile">
                <div className="org-main-info">
                  <h3 className="edp-org-name">{event.organizerDetails.name}</h3>
                  <p className="org-desc">{event.organizerDetails.description || "Leading event organizer committed to creating memorable experiences."}</p>
                </div>
                <div className="org-contact-grid">
                  <div className="contact-item">
                    <Mail size={14} />
                    <span>{event.organizerDetails.contactEmail}</span>
                  </div>
                  <div className="contact-item">
                    <Phone size={14} />
                    <span>{event.organizerDetails.contactPhone}</span>
                  </div>
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
                <Calendar size={22} strokeWidth={1.5} />
                <div className="info-text-container">
                  <p className="info-label">Date</p>
                  <p className="info-value">{formatDate(event.month, event.date)}</p>
                </div>
              </div>

              {event.time && (
                <div className="info-row">
                  <Clock size={22} strokeWidth={1.5} />
                  <div className="info-text-container">
                    <p className="info-label">Time</p>
                    <p className="info-value">{formatTime(event.time)} onwards</p>
                  </div>
                </div>
              )}

              <div className="info-row">
                <MapPin size={22} strokeWidth={1.5} />
                <div className="info-text-container">
                  <p className="info-label">Venue</p>
                  <p className="info-value">
                    {event.address || event.location}
                    {event.mapLink && (
                      <a href={event.mapLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '8px', color: '#2563eb', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
                        <ExternalLink size={12} style={{ marginRight: '4px' }}/> View Map
                      </a>
                    )}
                  </p>
                </div>
              </div>

              <div className="info-row">
                <Tag size={22} strokeWidth={1.5} />
                <div className="info-text-container">
                  <p className="info-label">Category</p>
                  <p className="info-value">{event.category}</p>
                </div>
              </div>

              <div className="price-ticket-section">
                {isUpcoming ? (
                  <span className="edp-upcoming-badge">Registration Opens Soon</span>
                ) : (
                  <div className="edp-price-container">
                    <p className="info-label">Ticket Price</p>
                    <div className="edp-price-display">
                      <span className="edp-price-value">
                        {event.status === 'completed' 
                          ? "EVENT ENDED" 
                          : (typeof event.price === 'string' && event.price.toLowerCase() === 'free'
                            ? "FREE"
                            : `₹${event.price}`)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="edp-description">{event.description}</p>

            {!isUpcoming && (
              <div className="edp-actions-row">
                <button
                  className="edp-book-btn"
                  onClick={() => navigate(`/seats/${category}/${id}`)}
                  disabled={event.status === 'completed'}
                  style={event.status === 'completed' ? { opacity: 0.5, cursor: 'not-allowed', background: '#64748b' } : {}}
                >
                  {event.status === 'completed' ? 'Event Ended' : 'Book Now'}
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
                    size={22}
                    fill={isFavorite(id) ? "#0b0f5b" : "none"}
                    color={isFavorite(id) ? "#0b0f5b" : "#666"}
                  />
                </button>

                <button
                  className="edp-share-btn"
                  onClick={handleShare}
                  aria-label="Share event"
                >
                  <Share2 size={22} color="#64748b" />
                </button>
              </div>
            )}

            {event.brochure && (
              <a 
                href={event.brochure} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="edp-brochure-link"
              >
                <FileText size={18} />
                Download Event Brochure
                <ExternalLink size={14} />
              </a>
            )}

            {event.declaration && (
              <div className="edp-declaration-box">
                <Info size={16} />
                <p>{event.declaration}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <RecommendedEvents currentEventId={id} currentCategory={event.category} />
    </>
  );
};

export default EventDetailPage;
