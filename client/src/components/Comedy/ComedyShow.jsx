import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getImageUrl } from "../../utils/imageUtils";
import { LogIn } from "lucide-react";
import toast from "react-hot-toast";
import "./ComedyShow.css";

const ComedyShow = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [showArrows, setShowArrows] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollWidth, clientWidth } = scrollRef.current;
      setShowArrows(scrollWidth > clientWidth);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/events`);
        setEvents(res.data);
      } catch (err) {
        console.error("Error fetching comedy events:", err);
      }
    };

    fetchEvents();
  }, []);

  /* ✅ Format Month (Apr, May, Jun...) */
  const formatMonth = (monthValue) => {
    if (!monthValue) return "";

    try {
      const date = new Date(`${monthValue}-01`);
      return date.toLocaleString("en-US", { month: "short" });
    } catch {
      return monthValue;
    }
  };

  // ✅ Filter only comedy category, exclude upcoming events
  const comedyShows = events.filter((event) => {
    if (event.category?.toLowerCase() !== "comedy") return false;
    if (event.declaration) return false;

    if (event.month && event.date) {
      try {
        const eventDate = new Date(`${event.month}-${String(event.date).padStart(2, "0")}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const fortyFiveDaysLater = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);

        // Show comedy events happening WITHIN the next 45 days
        return eventDate >= today && eventDate <= fortyFiveDaysLater;
      } catch (e) {
        console.error("Error parsing date:", e);
      }
    }

    return true;
  }).sort((a, b) => {
    const dateA = new Date(`${a.month}-${String(a.date).padStart(2, "0")}T00:00:00`);
    const dateB = new Date(`${b.month}-${String(b.date).padStart(2, "0")}T00:00:00`);
    return dateA - dateB;
  });

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [comedyShows]);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
  };

  return (
    <section className="comedy-events">
      <div className="comedy-events__header">
        <h2>Best Stand-Up Comedy Shows</h2>
      </div>

      {showArrows && (
        <button className="scroll-btn left" onClick={scrollLeft}>
          ❮
        </button>
      )}

      <div className="comedy-events__grid" ref={scrollRef}>
        {comedyShows.map((show) => (
          <article key={show._id} className="card">
            <div className="card__image">
              <img
                src={getImageUrl(show.image)}
                alt={show.title}
                onError={(e) => (e.target.src = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800")}
              />

              {/* ✅ Updated Date Format */}
              <div className="card__date">
                <span className="month">
                  {formatMonth(show.month)}
                </span>
                <span className="day">
                  {show.date}
                </span>
              </div>
            </div>

            <div className="card__body">
              <h3 className="card__title">{show.title}</h3>
              <p className="card__desc">{show.description}</p>

              <div className="card__meta">
                <div className="meta-left">
                  <span className="loc">📍 {show.location}</span>
                  <span className="cat">{show.category}</span>
                </div>
                <div className="meta-right">
                  <span className="price">
                    {typeof show.price === 'string' && show.price.toLowerCase() === 'free'
                      ? "Free"
                      : `Rs.${show.price}`}
                  </span>
                </div>
              </div>

              <div className="card__actions">
                <button
                  className="btn btn--primary"
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
                    navigate(`/seats/comedy/${show._id}`);
                  }}
                >
                  Book Now
                </button>

                <button
                  className="btn btn--ghost"
                  onClick={() => navigate(`/events/comedy/${show._id}`)}
                >
                  Details
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {showArrows && (
        <button className="scroll-btn right" onClick={scrollRight}>
          ❯
        </button>
      )}
    </section>
  );
};

export default ComedyShow;
