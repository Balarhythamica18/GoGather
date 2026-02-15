import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [organizerName, setOrganizerName] = useState("");

  const fetchEvents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/events");
      setEvents(res.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`);
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
    // fetch organizer profile if token present
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setOrganizerName(res.data.name || ""))
        .catch((err) => console.error("Error fetching profile:", err.response?.data || err.message));
    }
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.greeting}>Hi, {organizerName || localStorage.getItem("userName") || "Organizer"}</h3>
          <h1 style={styles.title}>Organizer Dashboard</h1>
        </div>

        <button
          style={styles.addButton}
          onClick={() => navigate("/add-event")}
        >
          + Add Event
        </button>
      </div>

      <div style={styles.grid}>
        {events.length === 0 ? (
          <p style={styles.noEvents}>No events available.</p>
        ) : (
          events.map((event) => (
            <div key={event._id} style={styles.card}>
              
              {/* Event Image */}
              <div style={styles.imageWrapper}>
                <img
                  src={event.image}
                  alt={event.title}
                  style={styles.image}
                />
              </div>

              {/* Event Info */}
              <div>
                <h3 style={styles.eventTitle}>{event.title}</h3>
                <p style={styles.location}>📍 {event.location}</p>
              </div>

              {/* Buttons */}
              <div style={styles.buttonRow}>
                <button
                  style={styles.editButton}
                  onClick={() => navigate(`/add-event/${event._id}`)}
                >
                  Edit
                </button>

                <button
                  style={styles.deleteButton}
                  onClick={() => handleDelete(event._id)}
                >
                  Delete
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    padding: "50px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    fontFamily: "Arial, sans-serif"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px"
  },

  title: {
    color: "white",
    fontSize: "32px",
    fontWeight: "bold"
  },

  addButton: {
    padding: "12px 25px",
    background: "white",
    color: "#764ba2",
    border: "none",
    borderRadius: "25px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "25px"
  },

  card: {
    background: "white",
    borderRadius: "15px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    transition: "transform 0.2s ease-in-out"
  },

  imageWrapper: {
    width: "100%",
    height: "160px",
    overflow: "hidden",
    borderRadius: "10px"
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  eventTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "#333"
  },

  location: {
    marginTop: "8px",
    color: "#777"
  },

  buttonRow: {
    display: "flex",
    justifyContent: "space-between"
  },

  deleteButton: {
    background: "#ff4d4d",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  editButton: {
    background: "#4caf50",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  noEvents: {
    color: "white",
    fontSize: "18px"
  }
};

export default OrganizerDashboard;
