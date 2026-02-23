    import React from "react";
import { useLocation } from "react-router-dom";

const ConfirmationPage = () => {
  const { state } = useLocation();
  const { booking } = state || {};

  if (!booking) return <p>No booking information.</p>;

  return (
    <div className="confirmation-page">
      <h2>Booking Confirmed ✅</h2>
      <p>Booking ID: {booking.bookingId}</p>
      <p>Status: Confirmed</p>
      <p>QR Code:</p>
      <img src={booking.qrCodeUrl || booking.qrCode} alt="QR Code" />
      <p>Check your email for the ticket as well!</p>
    </div>
  );
};

export default ConfirmationPage;