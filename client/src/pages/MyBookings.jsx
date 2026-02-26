import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, MapPin, Ticket, X, QrCode, ShieldCheck, CheckCircle2 } from "lucide-react";
import "./MyBookings.css";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("/api/bookings/my-bookings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (err) {
      console.error("Fetch bookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="my-bookings-container"><h2>Loading your experiences...</h2></div>;

  return (
    <div className="my-bookings-container">
      <h2>My Adventures</h2>

      <div className="bookings-grid">
        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '20px', color: '#64748b' }}>
            <Ticket size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No bookings yet. Start your journey today!</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking._id} className="premium-booking-card">
              <div className="card-image-section">
                <img src={booking.event?.image} alt={booking.event?.title} />
                <span className={`status-badge ${booking.isUsed ? 'used' : 'confirmed'}`}>
                  {booking.isUsed ? 'Already Used' : 'Upcoming'}
                </span>
              </div>

              <div className="card-details">
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#db2777', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {booking.event?.category}
                </span>
                <h3>{booking.event?.title}</h3>

                <div className="detail-row">
                  <Calendar size={16} />
                  <span>{booking.event?.date}</span>
                </div>
                <div className="detail-row">
                  <MapPin size={16} />
                  <span>{booking.event?.location}</span>
                </div>
                <div className="detail-row" style={{ marginTop: '8px', color: '#1e293b', fontWeight: 600 }}>
                  <Ticket size={16} />
                  <span>{booking.seats?.length || booking.ticketCount} Seat(s)</span>
                </div>
              </div>

              <div className="card-actions">
                <div className="price-tag">₹{booking.amount || booking.event?.price}</div>
                {booking.discountApplied && (
                  <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, marginBottom: '12px' }}>
                    20% FIRST BOOKING SAVED
                  </div>
                )}
                <button
                  className="view-ticket-btn"
                  onClick={() => setSelectedTicket(booking)}
                >
                  <QrCode size={18} />
                  View Ticket
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="ticket-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="ticket-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <button className="close-modal" onClick={() => setSelectedTicket(null)}><X size={20} /></button>
              <ShieldCheck size={32} style={{ marginBottom: '12px' }} />
              <h3 style={{ margin: 0 }}>Entry Pass</h3>
              <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.9rem' }}>{selectedTicket.event?.title}</p>
            </div>
            <div className="modal-body">
              <div className="qr-frame">
                <img src={selectedTicket.qrCode} alt="Ticket QR" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#1e293b' }}>
                  {selectedTicket.isUsed ? "Pass Used ✅" : "Scan at Entry"}
                </p>
                <span className="ticket-id">#{selectedTicket._id.toString().slice(-8).toUpperCase()}</span>
              </div>
              <div style={{ textAlign: 'left', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Seats</span>
                  <span style={{ fontWeight: 700 }}>{selectedTicket.seats?.join(", ") || selectedTicket.ticketCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Full Name</span>
                  <span style={{ fontWeight: 700 }}>{JSON.parse(localStorage.getItem("user"))?.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;

