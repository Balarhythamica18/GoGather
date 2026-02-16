import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TopEvent.css";

const TopEvent = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/events");
        setEvents(res.data);
      } catch (err) {
        console.error("Error fetching top events:", err);
      }
    };

    fetchEvents();
  }, []);

  // ✅ Exclude comedy & upcoming (by declaration or date > 1 month away)
  const topEventsData = events
    .filter((event) => {
      // Exclude comedy
      if (event.category?.toLowerCase() === "comedy") return false;

      // Exclude if manually marked as upcoming
      if (event.declaration) return false;

      // Exclude if date is more than 1 month away
      if (event.month && event.date) {
        try {
          const eventDate = new Date(`${event.month}-${String(event.date).padStart(2, "0")}`);
          const currentDate = new Date();
          const oneMonthLater = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          if (eventDate > oneMonthLater) return false; // exclude upcoming events
        } catch (e) {
          console.error("Error parsing date:", e);
        }
      }

      return true;
    })
    .slice(0, 10); // only first 10

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

      <button className="scroll-btn left" onClick={scrollLeft}>
        ❮
      </button>

      <div className="top-events__grid" ref={scrollRef}>
        {topEventsData.map((ev) => (
          <article key={ev._id} className="card">
            <div className="card__image">
                <img
                src={ev.image}
                alt={ev.title}
                onClick={() => navigate(`/events/top/${ev._id}`)}
                onError={(e) => (e.target.src = "/top/placeholder.png")}
                style={{ cursor: "pointer" }}
              />

              <div className="card__date">
                <span className="month">{ev.month}</span>
                <span className="day">{ev.date}</span>
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
                  <span className="price">{ev.price}</span>
                </div>
              </div>

              <div className="card__actions">
                <button className="btn btn--primary">Book Now</button>

                <button
                  className="btn btn--ghost"
                  onClick={() => navigate(`/events/top/${ev.id}`)}
                >
                  Details
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button className="scroll-btn right" onClick={scrollRight}>
        ❯
      </button>
    </section>
  );
};

export default TopEvent;
