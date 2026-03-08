import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, ClipboardList, User, Calendar, MapPin, Tag } from 'lucide-react';
import { API_BASE_URL } from '../../../config';

const ListBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/admin/bookings/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(res.data || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 className="admin-dashboard__title">Transaction History</h1>
          <p className="admin-dashboard__subtitle">Monitor all seat reservations and ticket purchases across the site.</p>
        </div>
      </header>

      {loading ? (
        <div style={styles.loadingState}>
          <Activity className="animate-spin" style={{ margin: '0 auto 16px auto', color: '#0b0f5b' }} />
          <p>Securing booking data...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div style={styles.emptyState}>
          <ClipboardList size={48} style={{ marginBottom: '16px', color: '#e2e8f0' }} />
          <p>No bookings have been recorded yet.</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Event Details</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Transaction Date</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td style={{ fontWeight: '700', fontSize: '13px', color: '#64748b' }}>
                    #{booking._id.substring(booking._id.length - 6).toUpperCase()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '800', color: '#1e293b' }}>{booking.eventId?.title || 'System Event'}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={10} /> {booking.eventId?.location || 'General'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '700' }}>{booking.userId?.name || 'Guest'}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{booking.userId?.email || ''}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: booking.status === 'confirmed' ? '#ecfdf5' : '#fff7ed',
                      color: booking.status === 'confirmed' ? '#059669' : '#c2410c',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      {booking.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {new Date(booking.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    animation: 'fadeIn 0.5s ease-out',
  },
  header: {
    marginBottom: '32px',
  },
  loadingState: {
    textAlign: 'center',
    padding: '100px',
    color: '#64748b',
  },
  emptyState: {
    textAlign: 'center',
    padding: '100px',
    color: '#94a3b8',
    background: '#fff',
    borderRadius: '20px',
    border: '1px solid #f1f5f9',
  }
};

export default ListBookings;
