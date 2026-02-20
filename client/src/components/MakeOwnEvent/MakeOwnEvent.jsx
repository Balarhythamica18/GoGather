import React from "react";
import "./MakeOwnEvent.css";
import { useNavigate } from "react-router-dom";


const MakeOwnEvent = () => {
  const navigate = useNavigate();
  return (
    <section className="make-event">
      <div className="make-event__container">

        {/* LEFT IMAGE */}
        <div className="make-event__image">
          <img src="/OwnEvent.png" alt="Sell your event tickets" />
        </div>

        {/* RIGHT CONTENT */}
        <div className="make-event__content">
          <h2>Want to sell your own event tickets?</h2>

          <p>
            List your event on our platform and start selling tickets with ease.
            Concerts, meetups, workshops, or conferences — we’ve got you covered.
          </p>

         <button className="create-event-btn" onClick={() => navigate("/login")}>
  Create Event
</button>

         
        </div>

      </div>
    </section>
  );
};

export default MakeOwnEvent;
