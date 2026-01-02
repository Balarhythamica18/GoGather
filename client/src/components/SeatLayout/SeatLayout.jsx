import React, { useState } from "react";
import "./SeatLayout.css";

const rows = ["A", "B", "C", "D", "E"];

const SeatLayout = ({ event }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [ticketCount, setTicketCount] = useState(1);

  const seatPrice = event.price
    ? Number(event.price.replace("₹", ""))
    : 0;

  // ❗ Art & Sport → no seat selection
  const isSeatBased =
    event.category !== "art" && event.category !== "sport";

  const totalAmount = isSeatBased
    ? selectedSeats.length * seatPrice
    : ticketCount * seatPrice;

  const toggleSeat = (seat) => {
    setSelectedSeats((prev) =>
      prev.includes(seat)
        ? prev.filter((s) => s !== seat)
        : [...prev, seat]
    );
  };

  const increaseTickets = () => {
    setTicketCount((prev) => prev + 1);
  };

  const decreaseTickets = () => {
    if (ticketCount > 1) {
      setTicketCount((prev) => prev - 1);
    }
  };

  return (
    <div
      className={`seat-wrapper ${
        !isSeatBased ? "center-summary" : ""
      }`}
    >
      {/* LEFT - SEAT SELECTION (ONLY FOR SEAT-BASED EVENTS) */}
      {isSeatBased && (
        <div className="seat-left">
          <h2>{event.title}</h2>
          <p className="seat-location">{event.location}</p>

          <div className="screen">SCREEN THIS WAY</div>

          <div className="seat-layout">
            {rows.map((row) => (
              <div className="seat-row" key={row}>
                <span className="row-label">{row}</span>

                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                  const seatId = `${row}${num}`;
                  return (
                    <button
                      key={seatId}
                      className={`seat ${
                        selectedSeats.includes(seatId)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => toggleSeat(seatId)}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="seat-legend">
            <span>
              <i className="available"></i> Available
            </span>
            <span>
              <i className="selected"></i> Selected
            </span>
            <span>
              <i className="booked"></i> Booked
            </span>
          </div>
        </div>
      )}

      {/* RIGHT - BOOKING SUMMARY */}
      <div className="seat-right">
        <h3>Booking Summary</h3>

        <p>
          <strong>Event</strong>
          <span>{event.title}</span>
        </p>

        <p>
          <strong>Location</strong>
          <span>{event.location}</span>
        </p>

        <p>
          <strong>Address</strong>
          <span>{event.address}</span>
        </p>

        {/* SEAT-BASED EVENTS */}
        {isSeatBased ? (
          <p>
            <strong>Seats</strong>
            <span>
              {selectedSeats.length > 0
                ? selectedSeats.join(", ")
                : "None"}
            </span>
          </p>
        ) : (
          /* ART & SPORT EVENTS */
          <div className="ticket-counter">
            <strong>Tickets</strong>
            <div className="counter-controls">
              <button onClick={decreaseTickets}>−</button>
              <span>{ticketCount}</span>
              <button onClick={increaseTickets}>+</button>
            </div>
          </div>
        )}

        <p>
          <strong>Price</strong>
          <span>₹{seatPrice}</span>
        </p>

        <p className="total">
          <strong>Total Amount</strong>
          <span>₹{totalAmount}</span>
        </p>

        <button
          className="pay-btn"
          disabled={
            isSeatBased
              ? selectedSeats.length === 0
              : ticketCount < 1
          }
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default SeatLayout;
