import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ComedyShow.css";

const ComedyShow = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/events");
        setEvents(res.data);
      } catch (err) {
        console.error("Error fetching comedy events:", err);
      }
    };

    fetchEvents();
  }, []);

  // ✅ Filter only comedy category, exclude upcoming events (> 1 month away or has declaration)
  const comedyShows = events.filter((event) => {
    // Must be comedy
    if (event.category?.toLowerCase() !== "comedy") return false;

    // Exclude if marked as upcoming
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
  });

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

      <button className="scroll-btn left" onClick={scrollLeft}>
        ❮
      </button>

      <div className="comedy-events__grid" ref={scrollRef}>
        {comedyShows.map((show) => (
          <article key={show._id} className="card">
            <div className="card__image">
                <img
                  src={show.image}
                  alt={show.title}
                  onError={(e) => (e.target.src = "/top/placeholder.png")}
                />

              <div className="card__date">
                <span className="month">{show.month}</span>
                <span className="day">{show.date}</span>
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
                  <span className="price">{show.price}</span>
                </div>
              </div>

              <div className="card__actions">
                <button className="btn btn--primary">Book Now</button>

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

      <button className="scroll-btn right" onClick={scrollRight}>
        ❯
      </button>
    </section>
  );
};

export default ComedyShow;
