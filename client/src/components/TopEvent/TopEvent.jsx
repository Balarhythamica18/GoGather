import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getImageUrl } from "../../utils/imageUtils";
import "./TopEvent.css";

const TopEvent = () => {
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
        console.error("Error fetching top events:", err);
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
      if (event.category?.toLowerCase() === "comedy") return false;
      if (event.declaration) return false;

      if (event.month && event.date) {
        try {
          const eventDate = new Date(
            `${event.month}-${String(event.date).padStart(2, "0")}`
          );
          const currentDate = new Date();
          const oneMonthLater = new Date(
            currentDate.getTime() + 45 * 24 * 60 * 60 * 1000
          );
          if (eventDate > oneMonthLater) return false;
        } catch (e) {
          console.error("Error parsing date:", e);
        }
      }

      return true;
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
        {topEventsData.map((ev) => (
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
                  <span className="loc">📍 {ev.location}</span>
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
                <button
                  className="btn btn--primary"
                  onClick={() => navigate(`/seats/top/${ev._id}`)}
                >
                  Book Now
                </button>

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
