import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { allEvents } from "../../data/assets";
import "./ComedyShow.css";

const ComedyShow = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Filter only comedy category
  const comedyShows = allEvents.filter(
    (event) => event.category?.toLowerCase() === "comedy"
  );

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
          <article key={show.id} className="card">
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
                  onClick={() => navigate(`/events/comedy/${show.id}`)}
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
