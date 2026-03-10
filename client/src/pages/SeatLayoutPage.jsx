import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import SeatLayout from "../components/SeatLayout/SeatLayout";
import Skeleton from "../components/ui/Skeleton";

const SeatLayoutPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/events/${id}`);
        setEvent(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) return (
    <div className="seat-wrapper" style={{ gap: '40px', padding: '40px 6%' }}>
      <div className="seat-left" style={{ flex: 1.5 }}>
        <Skeleton width="60%" height="32px" className="skeleton-lighting" style={{ marginBottom: '12px' }} />
        <Skeleton width="40%" height="18px" className="skeleton-lighting" style={{ marginBottom: '40px' }} />

        <div style={{ marginBottom: '40px' }}>
          <Skeleton width="100%" height="45px" borderRadius="12px" className="skeleton-lighting" style={{ opacity: 0.6 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '12px', marginBottom: '40px' }}>
          {[...Array(60)].map((_, i) => (
            <Skeleton key={i} width="100%" height="35px" borderRadius="8px" className="skeleton-lighting" />
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>
          <Skeleton width="200px" height="24px" className="skeleton-lighting" style={{ marginBottom: '16px' }} />
          <div style={{ display: 'flex', gap: '12px' }}>
            <Skeleton width="100px" height="30px" borderRadius="20px" className="skeleton-lighting" />
            <Skeleton width="100px" height="30px" borderRadius="20px" className="skeleton-lighting" />
            <Skeleton width="100px" height="30px" borderRadius="20px" className="skeleton-lighting" />
          </div>
        </div>
      </div>

      <div className="seat-right" style={{ flex: 1, background: '#fff', padding: '32px', borderRadius: '24px', alignSelf: 'flex-start' }}>
        <Skeleton width="70%" height="24px" className="skeleton-lighting" style={{ marginBottom: '24px' }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Skeleton width="30%" height="14px" className="skeleton-lighting" />
            <Skeleton width="50%" height="14px" className="skeleton-lighting" />
          </div>
        ))}
        <Skeleton width="100%" height="56px" borderRadius="14px" className="skeleton-lighting" style={{ marginTop: '24px' }} />
      </div>
    </div>
  );
  if (error) return <h2 style={{ textAlign: "center" }}>Event Not Found</h2>;
  if (!event) return <h2 style={{ textAlign: "center" }}>Event Not Found</h2>;

  return <SeatLayout event={event} />;
};

export default SeatLayoutPage;
