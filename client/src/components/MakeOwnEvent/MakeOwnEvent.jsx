import React from "react";
import "./MakeOwnEvent.css";

const MakeOwnEvent = () => {
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

          <a
            href="mailto:events@gogather.com?subject=Event Ticket Listing Request"
            className="make-event__button"
          >
            Contact Us
          </a>
        </div>

      </div>
    </section>
  );
};

export default MakeOwnEvent;
