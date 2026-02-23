import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import "./SeatLayout.css";

const rows = ["A", "B", "C", "D", "E"];
const socket = io("http://localhost:5000");

/* ⭐ SAFE PARSE HELPER (PREVENT JSON CRASH) */
const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const SeatLayout = ({ event, user }) => {
  const navigate = useNavigate();

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState({});
  const [ticketCount, setTicketCount] = useState(1);

  /* ⭐ SAFE USER RESTORE */
  const storedUser = safeParse(localStorage.getItem("user"));
  const currentUser = user || storedUser;

  const isFirstLogin = localStorage.getItem("firstLogin") === "true";

  const seatPrice =
    Number(String(event?.price || 0).replace(/[^\d]/g, "")) || 0;

  const isSeatBased =
    event?.category?.toLowerCase() !== "art" &&
    event?.category?.toLowerCase() !== "sport";

  const subtotal = isSeatBased
    ? selectedSeats.length * seatPrice
    : ticketCount * seatPrice;

  const discount = isFirstLogin ? subtotal * 0.2 : 0;
  const totalAmount = subtotal - discount;

  /* FETCH BOOKED SEATS */
  useEffect(() => {
    if (!event?._id) return;

    const fetchSeats = async () => {
      try {
        const res = await fetch(`/api/bookings/seats/${event._id}`);
        if (!res.ok) return;

        const data = await res.json();
        setBookedSeats(data.bookedSeats || []);
      } catch (err) {
        console.error("Seat fetch error:", err);
      }
    };

    fetchSeats();
  }, [event?._id]);

  /* SOCKET EVENTS */
  useEffect(() => {
    if (!event?._id) return;

    socket.emit("joinEvent", event._id);

    const onLock = ({ eventId, seat }) => {
      if (eventId === event._id) {
        setLockedSeats((p) => ({ ...p, [seat]: true }));
      }
    };

    const onUnlock = ({ eventId, seat }) => {
      if (eventId === event._id) {
        setLockedSeats((p) => {
          const u = { ...p };
          delete u[seat];
          return u;
        });
      }
    };

    socket.on("seatLocked", onLock);
    socket.on("seatUnlocked", onUnlock);

    return () => {
      socket.off("seatLocked", onLock);
      socket.off("seatUnlocked", onUnlock);
    };
  }, [event?._id]);

  /* TOGGLE SEAT */
  const toggleSeat = (seat) => {
    if (!event?._id) return;
    if (bookedSeats.includes(seat) || lockedSeats[seat]) return;

    const isAlreadySelected = selectedSeats.includes(seat);

    const updated = isAlreadySelected
      ? selectedSeats.filter((s) => s !== seat)
      : [...selectedSeats, seat];

    setSelectedSeats(updated);

    socket.emit(isAlreadySelected ? "unlockSeat" : "lockSeat", {
      eventId: event._id,
      seat,
    });
  };

  const increaseTickets = () => setTicketCount((p) => p + 1);
  const decreaseTickets = () => {
    if (ticketCount > 1) setTicketCount((p) => p - 1);
  };

  /* PAYMENT */
  const handlePayment = () => {
    if (!event?._id || !currentUser?._id) {
      alert("User or event missing — login again");
      return;
    }

    const bookingData = {
      userId: currentUser._id,
      userEmail: currentUser.email,
      eventId: event._id,
      seats: selectedSeats,
      ticketCount,
      amount: totalAmount,
    };

    localStorage.setItem("bookingData", JSON.stringify(bookingData));
    navigate("/payment");
  };

  /* EVENT SAFETY */
  if (!event || !event._id) return <p>Loading event...</p>;

  return (
    <div className={`seat-wrapper ${!isSeatBased ? "center-summary" : ""}`}>
      {isSeatBased && (
        <div className="seat-left">
          <h2>{event?.title}</h2>
          <p className="seat-location">{event?.location}</p>

          <div className="screen">SCREEN THIS WAY</div>

          <div className="seat-layout">
            {rows.map((row) => (
              <div className="seat-row" key={row}>
                <span className="row-label">{row}</span>

                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                  const seatId = `${row}${num}`;
                  const isLocked = lockedSeats[seatId];
                  const isBooked = bookedSeats.includes(seatId);

                  return (
                    <button
                      key={seatId}
                      className={`seat ${
                        selectedSeats.includes(seatId)
                          ? "selected"
                          : isBooked
                          ? "booked"
                          : isLocked
                          ? "locked"
                          : ""
                      }`}
                      disabled={isBooked || isLocked}
                      onClick={() => toggleSeat(seatId)}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="seat-right">
        <h3>Booking Summary</h3>

        <p><strong>Event</strong><span>{event?.title}</span></p>
        <p><strong>Location</strong><span>{event?.location}</span></p>
        <p><strong>Address</strong><span>{event?.address}</span></p>

        <p><strong>Seats</strong>
          <span>{selectedSeats.length ? selectedSeats.join(", ") : "None"}</span>
        </p>

        <p><strong>Price</strong><span>₹{seatPrice}</span></p>

        <p className="total">
          <strong>Total Amount</strong>
          <span>₹{totalAmount}</span>
        </p>

        <button
          className="pay-btn"
          disabled={selectedSeats.length === 0}
          onClick={handlePayment}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default SeatLayout;