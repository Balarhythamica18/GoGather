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
            {booking.eventTitle && (
              <div className="info-row">
                <label>Event</label>
                <span>{booking.eventTitle}</span>
              </div>
            )}
            {booking.ticketCount && (
              <div className="info-row">
                <label>Tickets</label>
                <span>{booking.ticketCount} Person(s)</span>
              </div>
            )}
          </div>

          <div className="qr-section">
            <p className="qr-label">Digital Entry Ticket</p>
            <div className="qr-container">
              <img src={booking.qrCodeUrl || booking.qrCode || "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GoGather_Verified"} alt="Entry Pass QR" />
              <div className="corner corner-tl"></div>
              <div className="corner corner-tr"></div>
              <div className="corner corner-bl"></div>
              <div className="corner corner-br"></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
          <Link to="/my-bookings" className="action-btn primary-btn">
            <Ticket size={18} />
            My Tickets
          </Link>
          <button onClick={() => window.print()} className="action-btn secondary-btn">
            <Download size={18} />
            Save as PDF
          </button>
        </div>

        <div className="email-note">
          <Mail size={14} />
          Copy of ticket sent to your email
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
