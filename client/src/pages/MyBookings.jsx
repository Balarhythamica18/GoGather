import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, MapPin, Ticket, X, QrCode, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { getImageUrl } from "../utils/imageUtils";
import { API_BASE_URL } from "../config";
import "./MyBookings.css";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: "", message: "", onConfirm: null });
  const [resultModal, setResultModal] = useState({ show: false, type: "success", title: "", message: "", data: null });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data || []);
    } catch (err) {
      console.error("Fetch bookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    setConfirmModal({
      show: true,
      title: "Cancel Booking",
      message: "Are you sure you want to cancel this booking? Refund will be calculated based on the policy.",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        const token = localStorage.getItem("token");
        try {
          const res = await axios.post(`${API_BASE_URL}/api/bookings/cancel`, { bookingId }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setResultModal({
            show: true,
            type: "success",
            title: "Booking Cancelled",
            message: "Your booking has been cancelled successfully.",
            data: {
              policy: res.data.refundPolicy,
              amount: res.data.refundAmount
            }
          });
          fetchBookings();
        } catch (err) {
          console.error("Cancel error:", err);
          setResultModal({
            show: true,
            type: "error",
            title: "Cancellation Failed",
            message: err.response?.data?.error || "Failed to cancel booking"
          });
        }
      }
    });
  };

  const handleDelete = async (bookingId) => {
    setConfirmModal({
      show: true,
      title: "Delete Record",
      message: "Are you sure you want to remove this booking from your history? This action cannot be undone.",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        const token = localStorage.getItem("token");
        try {
          await axios.delete(`${API_BASE_URL}/api/bookings/${bookingId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchBookings();
        } catch (err) {
          console.error("Delete error:", err);
          setResultModal({
            show: true,
            type: "error",
            title: "Delete Failed",
            message: err.response?.data?.error || "Failed to delete booking record"
          });
        }
      }
    });
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
                <img src={getImageUrl(booking.event?.image)} alt={booking.event?.title} />
                <span className={`status-badge ${booking.status} ${booking.isUsed ? 'used' : ''}`}>
                  {booking.status === 'cancelled' ? 'Cancelled' : (booking.isUsed ? 'Already Used' : 'Upcoming')}
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

              <div className="card-status-info">
                <div className={`status-container ${booking.status}`}>
                  {booking.status === 'cancelled' ? (
                    <>
                      <div className="status-header">
                        <X size={20} color="#ef4444" />
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>Cancelled</span>
                      </div>
                      <p className="status-note">Note: Refund of ₹{booking.amount} has been initiated to your original payment method.</p>
                    </>
                  ) : (
                    <>
                      <div className="status-header">
                        <CheckCircle2 size={20} color="#10b981" />
                        <span style={{ color: '#10b981', fontWeight: 700 }}>Confirmed</span>
                      </div>
                      <p className="status-note">Your booking is secured. You can view your ticket for entry.</p>
                    </>
                  )}
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
                  disabled={booking.status === 'cancelled'}
                >
                  <QrCode size={18} />
                  {booking.status === 'cancelled' ? 'Cancelled' : 'View Ticket'}
                </button>
                {booking.status !== 'cancelled' && !booking.isUsed && (
                  <button
                    className="cancel-ticket-btn"
                    onClick={() => handleCancel(booking._id)}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid #fee2e2',
                      background: '#fff',
                      color: '#ef4444',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <X size={16} />
                    Cancel Ticket
                  </button>
                )}
                {booking.status === 'cancelled' && (
                  <button
                    className="delete-ticket-btn"
                    onClick={() => handleDelete(booking._id)}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9',
                      background: '#f8fafc',
                      color: '#64748b',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <X size={16} />
                    Delete Record
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Modal */}
      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="ticket-modal-overlay" onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}>
          <div className="ticket-modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header confirm">
              <button className="close-modal" onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}><X size={20} /></button>
              <AlertTriangle size={32} style={{ marginBottom: '12px', color: '#fff' }} />
              <h3 style={{ margin: 0 }}>{confirmModal.title}</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '24px' }}>{confirmModal.message}</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="modal-btn cancel"
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}
                >
                  Go Back
                </button>
                <button
                  className="modal-btn confirm"
                  onClick={confirmModal.onConfirm}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                >
                  Yes, Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal.show && (
        <div className="ticket-modal-overlay" onClick={() => setResultModal(prev => ({ ...prev, show: false }))}>
          <div className="ticket-modal result-modal" onClick={e => e.stopPropagation()}>
            <div className={`modal-header ${resultModal.type}`}>
              <button className="close-modal" onClick={() => setResultModal(prev => ({ ...prev, show: false }))}><X size={20} /></button>
              {resultModal.type === "success" ? <CheckCircle2 size={40} /> : <X size={40} />}
              <h3 style={{ margin: '12px 0 0' }}>{resultModal.title}</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: resultModal.data ? '20px' : '0' }}>{resultModal.message}</p>

              {resultModal.data && (
                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '16px', border: '1px solid #dcfce7', textAlign: 'left', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#166534', fontWeight: 600 }}>Policy</span>
                    <span style={{ color: '#166534' }}>{resultModal.data.policy}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                    <span style={{ color: '#166534', fontWeight: 700 }}>Refund Amount</span>
                    <span style={{ color: '#166534', fontWeight: 800 }}>₹{resultModal.data.amount}</span>
                  </div>
                </div>
              )}

              <button
                className="modal-btn"
                onClick={() => setResultModal(prev => ({ ...prev, show: false }))}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;

