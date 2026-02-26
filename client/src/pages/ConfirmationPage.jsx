import React from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle2, Ticket, Mail, ArrowRight, Download } from "lucide-react";
import "./ConfirmationPage.css";

const ConfirmationPage = () => {
  const { state } = useLocation();
  const { booking } = state || {};

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

        <div className="ticket-info">
          <div className="info-row">
            <label>Booking ID</label>
            <span>#{booking.bookingId?.slice(-8).toUpperCase() || "B-1092384"}</span>
          </div>
          <div className="info-row">
            <label>Status</label>
            <span style={{ color: '#10b981' }}>Confirmed</span>
          </div>
          {booking.eventTitle && (
            <div className="info-row">
              <label>Event</label>
              <span>{booking.eventTitle}</span>
            </div>
          )}
        </div>

        <div className="qr-section">
          <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', color: '#475569' }}>Digital Entry Ticket</p>
          <img src={booking.qrCodeUrl || booking.qrCode || "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GoGather_Verified"} alt="Entry Pass QR" />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/my-bookings" className="action-btn">
            <Ticket size={18} />
            My Tickets
          </Link>
          <button onClick={() => window.print()} className="action-btn" style={{ background: '#f1f5f9', color: '#475569' }}>
            <Download size={18} />
            Print
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
