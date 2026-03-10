import React from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle2, Ticket, Mail, ArrowRight, Download } from "lucide-react";
import "./ConfirmationPage.css";

const ConfirmationPage = () => {
  const { state } = useLocation();
  const { booking } = state || {};

  // ⭐ Update user booking status in session
  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user._id && !user.hasBooked) {
      user.hasBooked = true;
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("storageChange"));
    }
  }, []);

  if (!booking) {
    return (
      <div className="confirmation-container">
        <div className="confirmation-card">
          <h2>No booking found</h2>
          <Link to="/events" className="action-btn">Back to Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="success-icon">
          <CheckCircle2 size={48} />
        </div>

        <h2>Booking Confirmed!</h2>
        <p className="subtitle">Your tickets are ready. Get ready for an amazing experience!</p>

        <div className="printable-ticket" id="printable-ticket">
          <div className="ticket-info">
            <div className="info-row">
              <label>Booking ID</label>
              <span>#{booking.bookingId?.slice(-8).toUpperCase() || "B-1092384"}</span>
            </div>
            <div className="info-row">
              <label>Status</label>
              <span className="status-confirmed">Confirmed</span>
            </div>
          </div>


        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <Link to="/my-bookings" className="action-btn primary-btn">
            <Ticket size={18} />
            My Tickets
          </Link>
        </div>


      </div>
    </div>
  );
};

export default ConfirmationPage;
