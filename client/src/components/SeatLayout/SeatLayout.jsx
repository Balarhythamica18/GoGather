import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import toast from "react-hot-toast";
import { LogIn } from "lucide-react";
import "./SeatLayout.css";

const rows = ["A", "B", "C", "D", "E"];
const socket = io(API_BASE_URL, {
  transports: ['polling', 'websocket']
});

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
  const [isProcessing, setIsProcessing] = useState(false);

  /* ⭐ SAFE USER RESTORE */
  const storedUser = safeParse(localStorage.getItem("user"));
  const currentUser = user || storedUser;

  /* ⭐ REAL BOOKING HISTORY CHECK (For 20% Discount) */
  // Only apply 20% discount if the user has NEVER booked before
  const isFirstBooking = currentUser && currentUser.hasBooked === false;

  const seatPrice =
    Number(String(event?.price || 0).replace(/[^\d]/g, "")) || 0;

  const isSeatBased =
    event?.category?.toLowerCase() !== "art" &&
    event?.category?.toLowerCase() !== "sports" &&
    event?.category?.toLowerCase() !== "food";

  const subtotal = isSeatBased
    ? selectedSeats.length * seatPrice
    : ticketCount * seatPrice;

  const discount = isFirstBooking ? subtotal * 0.2 : 0;
  const totalAmount = subtotal - discount;

  /* FETCH BOOKED SEATS */
  useEffect(() => {
    if (!event?._id || !isSeatBased) return;

    const fetchSeats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings/seats/${event._id}`);
        if (!res.ok) return;

        const data = await res.json();
        setBookedSeats(data.bookedSeats || []);
      } catch (err) {
        console.error("Seat fetch error:", err);
      }
    };

    fetchSeats();
  }, [event?._id, isSeatBased]);

  /* SOCKET EVENTS */
  useEffect(() => {
    if (!event?._id || !isSeatBased) return;

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
  }, [event?._id, isSeatBased]);

  /* TOGGLE SEAT */
  const toggleSeat = (seat) => {
    if (!event?._id || !isSeatBased) return;
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
  const handlePayment = async () => {
    if (!event?._id || !currentUser?._id) {
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

    setIsProcessing(true);

    const bookingPayload = {
      userId: currentUser._id,
      eventId: event._id,
      seats: selectedSeats,
      ticketCount: isSeatBased ? selectedSeats.length : ticketCount,
      amount: totalAmount,
    };

    try {
      // 1. Create a pending booking in the database
      const response = await fetch(`${API_BASE_URL}/api/bookings/create-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) throw new Error("Failed to initiate booking");

      const data = await response.json();

      // If the event is Free (Total Amount is 0), bypass the payment page
      if (totalAmount === 0) {
        // Verify payment directly
        const verifyRes = await fetch(`${API_BASE_URL}/api/bookings/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: data.bookingId, // Real ID from DB
            paymentId: "PAY_FREE_" + Math.random().toString(36).substr(2, 9),
            userEmail: currentUser.email,
          }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok && !verifyData.booking) {
          throw new Error(verifyData.error || "Failed to verify free booking");
        }

        setIsProcessing(false);
        navigate("/confirmation", { state: { booking: verifyData, isSimulated: true } });
        return;
      }

      // 2. Prepare data for PaymentPage
      const bookingData = {
        bookingId: data.bookingId, // Real ID from DB
        userId: currentUser._id,
        userEmail: currentUser.email,
        eventId: event._id,
        seats: selectedSeats,
        ticketCount: isSeatBased ? selectedSeats.length : ticketCount,
        amount: data.amount, // Use amount from server (it might have first-timer discount)
        eventName: event.title,
      };

      localStorage.setItem("bookingData", JSON.stringify(bookingData));
      setIsProcessing(false);
      navigate("/payment", { state: { bookingData } });
    } catch (err) {
      console.error("Booking initiation error:", err);
      setIsProcessing(false);
      alert("Failed to start booking process. Please try again.");
    }
  };

  /* EVENT SAFETY */
  if (!event || !event._id) return <p>Loading event...</p>;

  return (
    <div className={`seat-wrapper ${!isSeatBased ? "center-summary" : ""}`}>
      {isSeatBased ? (
        <div className="seat-left">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{event?.title}</h2>
          </div>
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
                      className={`seat ${selectedSeats.includes(seatId)
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
      ) : (
        <div className="seat-left empty-view" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '12px' }}>{event?.title}</h2>
            <p style={{ color: '#64748b' }}>Select number of tickets in the summary section.</p>
          </div>
        </div>
      )}

      <div className="seat-right">
        <h3>Booking Summary</h3>

        <p><strong>Event</strong><span>{event?.title}</span></p>
        <p><strong>Location</strong><span>{event?.location}</span></p>
        <p><strong>Address</strong><span>{event?.address}</span></p>

        {isSeatBased ? (
          <p><strong>Seats</strong>
            <span>{selectedSeats.length ? selectedSeats.join(", ") : "None"}</span>
          </p>
        ) : (
          <div className="ticket-counter">
            <p><strong>Tickets</strong></p>
            <div className="counter-controls">
              <button onClick={decreaseTickets}>-</button>
              <span>{ticketCount}</span>
              <button onClick={increaseTickets}>+</button>
            </div>
          </div>
        )}

        {seatPrice > 0 && (
          <p><strong>Price</strong><span>₹{seatPrice}</span></p>
        )}

        <p className="total">
          <strong>Total Amount</strong>
          <span>{totalAmount === 0 ? "Free" : `₹${totalAmount}`}</span>
        </p>

        {seatPrice > 0 && (
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '16px', lineHeight: '1.4' }}>
            * <strong>Refund Policy:</strong> 100% refund within 2h of booking.
            Thereafter, 90% refund ({">"}48h) or 50% refund (24-48h). Non-refundable if {"<"}24h.
          </div>
        )}

        <button
          className="pay-btn"
          disabled={isProcessing || (isSeatBased ? selectedSeats.length === 0 : ticketCount === 0)}
          onClick={handlePayment}
        >
          {isProcessing ? "Processing..." : (totalAmount === 0 ? "Book Tickets" : "Proceed to Payment")}
        </button>

      </div>
    </div>
  );
};

export default SeatLayout;
