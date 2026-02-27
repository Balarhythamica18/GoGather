import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import SeatLayout from "../components/SeatLayout/SeatLayout";

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

  if (loading) return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
  if (error) return <h2 style={{ textAlign: "center" }}>Event Not Found</h2>;
  if (!event) return <h2 style={{ textAlign: "center" }}>Event Not Found</h2>;

  return <SeatLayout event={event} />;
};

export default SeatLayoutPage;
