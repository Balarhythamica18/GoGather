import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getImageUrl } from "../../utils/imageUtils";
import { LogIn } from "lucide-react";
import toast from "react-hot-toast";
import Skeleton from "../ui/Skeleton";
import "./TopEvent.css";

const TopEvent = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
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
        console.error("Error fetching top events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // ✅ Format Month (Apr, May, Jun...)
  const formatMonth = (monthValue) => {
    if (!monthValue) return "";

    try {
      const date = new Date(`${monthValue}-01`);
      return date.toLocaleString("en-US", { month: "short" });
    } catch {
      return monthValue;
    }
  };

  // ✅ Exclude comedy & upcoming
  const topEventsData = events
    .filter((event) => {
      if (event.status === "completed") return false;
      if (event.category?.toLowerCase() === "comedy") return false;
      if (event.declaration) return false;

      if (event.month && event.date) {
        try {
          const eventDate = new Date(`${event.month}-${String(event.date).padStart(2, "0")}T00:00:00`);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const fortyFiveDaysLater = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);

          // Show events happening WITHIN the next 45 days
          return eventDate >= today && eventDate <= fortyFiveDaysLater;
        } catch (e) {
          console.error("Error parsing date:", e);
        }
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.month}-${String(a.date).padStart(2, "0")}T00:00:00`);
      const dateB = new Date(`${b.month}-${String(b.date).padStart(2, "0")}T00:00:00`);
      return dateA - dateB;
    })
    .slice(0, 10);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [topEventsData]);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
  };

  return (
    <section className="top-events">
      <div className="top-events__header">
        <h2>Top Events 2026</h2>
      </div>

      {showArrows && (
        <button className="scroll-btn left" onClick={scrollLeft}>
          ❮
        </button>
      )}

      <div className="top-events__grid" ref={scrollRef}>
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="card">
              <div className="card__image">
                <Skeleton height="100%" borderRadius="0px" />
              </div>
              <div className="card__body">
                <Skeleton height="20px" width="80%" style={{ marginBottom: '10px' }} />
                <Skeleton height="14px" width="95%" style={{ marginBottom: '8px' }} />
                <Skeleton height="14px" width="60%" style={{ marginBottom: '20px' }} />
                <div className="card__actions">
                  <Skeleton height="36px" width="48%" borderRadius="8px" />
                  <Skeleton height="36px" width="48%" borderRadius="8px" />
                </div>
              </div>
            </div>
          ))
          : topEventsData.map((ev) => (
            <article key={ev._id} className="card">
              <div className="card__image">
                <img
                  src={getImageUrl(ev.image)}
                  alt={ev.title}
                  onClick={() => navigate(`/events/top/${ev._id}`)}
                  onError={(e) => (e.target.src = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800")}
                  style={{ cursor: "pointer" }}
                />

                {/* ✅ Updated Date Format */}
                <div className="card__date">
                  <span className="month">
                    {formatMonth(ev.month)}
                  </span>
                  <span className="day">
                    {ev.date}
                  </span>
                </div>
              </div>

              <div className="card__body">
                <h3 className="card__title">{ev.title}</h3>
                <p className="card__desc">{ev.description}</p>

                <div className="card__meta">
                  <div className="meta-left">
                    <span className="loc"> 📍 {ev.location}</span>
                    <span className="cat">{ev.category}</span>
                  </div>
                  <div className="meta-right">
                    <span className="price">
                      {typeof ev.price === 'string' && ev.price.toLowerCase() === 'free'
                        ? "Free"
                        : `Rs.${ev.price}`}
                    </span>
                  </div>
                </div>

                <div className="card__actions">
                  {(() => {
                    // Live Status Logic
                    const monthMap = {
                      'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
                      'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11,
                      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
                    };

                    let foundMonth = -1;
                    let foundDay = -1;
                    let foundYear = 2026;

                    if (ev.month?.includes("-")) {
                      const [y, m] = ev.month.split("-");
                      foundYear = parseInt(y);
                      foundMonth = parseInt(m) - 1;
                    } else if (ev.month) {
                      foundMonth = monthMap[ev.month.toLowerCase().trim()] ?? -1;
                    }

                    const dayMatch = ev.date?.toString().match(/\d+/);
                    if (dayMatch) foundDay = parseInt(dayMatch[0]);

                    if (foundMonth === -1 || foundDay === -1) return null;

                    const mStr = String(foundMonth + 1).padStart(2, '0');
                    const dStr = String(foundDay).padStart(2, '0');
                    const [sH, sM] = ev.time.split(":");
                    const start = new Date(`${foundYear}-${mStr}-${dStr}T${sH}:${sM}:00+05:30`);

                    let end;
                    if (ev.endTime) {
                      const [eH, eM] = ev.endTime.split(":");
                      end = new Date(`${foundYear}-${mStr}-${dStr}T${eH}:${eM}:00+05:30`);
                    } else {
                      end = new Date(`${foundYear}-${mStr}-${dStr}T23:59:59+05:30`);
                    }

                    const now = new Date();
                    const windowEnd = new Date(start.getTime() + 15 * 60 * 1000);

                    const isEnded = now >= end;
                    const isBookingActive = now <= (windowEnd.getTime() - 2 * 60 * 1000) && !isEnded;
                    const isClosed = now > windowEnd && !isEnded;
                    const noSeats = ev.availableSeats === 0;

                    const buttonLabel = isEnded ? "Event Ended" :
                      (noSeats && isBookingActive ? "All Seats Are Booked" :
                        (now < start ? "Book Now" :
                          (isClosed ? "Booking Closed" : "Book Now")));

                    return (
                      <>

                        {buttonLabel !== "All Seats Are Booked" && (
                          <button
                            className="btn btn--primary"
                            disabled={!isBookingActive || noSeats || isEnded}
                            style={{
                              backgroundColor: isEnded ? '#64748b' : ((noSeats && isBookingActive) ? '#64748b' : undefined),
                              cursor: (!isBookingActive || noSeats || isEnded) ? 'not-allowed' : 'pointer',
                              opacity: (isClosed || isEnded) ? 0.7 : 1,
                              flex: 1
                            }}
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
                              navigate(`/seats/top/${ev._id}`);
                            }}
                          >
                            {buttonLabel}
                          </button>
                        )}
                      </>
                    );
                  })()}

                  <button
                    className="btn btn--ghost"
                    onClick={() => navigate(`/events/top/${ev._id}`)}
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

export default TopEvent;
