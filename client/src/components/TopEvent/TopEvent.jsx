import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { topevents } from "../../data/assets";
import "./TopEvent.css";

const TopEvent = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
  };

  return (
    <section className="top-events">
      <div className="top-events__header">
        <h2>Top Events-2026</h2>
      </div>

      <button className="scroll-btn left" onClick={scrollLeft}>
        ❮
      </button>

      <div className="top-events__grid" ref={scrollRef}>
        {topevents.map((ev) => (
          <article key={ev.id} className="card">
            <div className="card__image">
              <img
                src={ev.image}
                alt={ev.title}
                onClick={() => navigate(`/events/top/${ev.id}`)}
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
