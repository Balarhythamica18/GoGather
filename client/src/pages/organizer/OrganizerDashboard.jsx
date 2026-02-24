import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      // If token exists, request the organizer's own events; otherwise fall back to public events
      if (token) {
        const res = await axios.get("http://localhost:5000/api/events/my", config);
        setEvents(res.data);
      } else {
        const res = await axios.get("http://localhost:5000/api/events");
        setEvents(res.data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleDelete = (event) => {
    setEventToDelete(event);
    setShowConfirmation(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.delete(`http://localhost:5000/api/events/${eventToDelete._id}`, config);
      fetchEvents();
      setShowConfirmation(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Error deleting event: " + (error.response?.data?.message || error.message));
      setShowConfirmation(false);
      setEventToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmation(false);
    setEventToDelete(null);
  };

  useEffect(() => {
    // fetch organizer profile if token present, then fetch events filtered for this organizer
    const init = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const profile = await axios.get("http://localhost:5000/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setOrganizerName(profile.data.name || "");
          setOrganizerEmail(profile.data.email || "");
        } catch (err) {
          console.error("Error fetching profile:", err.response?.data || err.message);
        }
      }

      // fetch events after profile (organizerEmail) is set
      await fetchEvents();
    };

    init();
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
        <button
          style={{ ...styles.addButton, marginLeft: 12, background: '#ff4d4d', color: 'white' }}
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('userName');
            navigate('/');
          }}
        >
          Logout
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
                  onClick={() => handleDelete(event)}
                >
                  Delete
                </button>
              </div>

              {/* Status Badge */}
              <div style={{
                ...styles.statusBadge,
                ...(event.status === "approved" ? styles.statusApproved :
                  event.status === "rejected" ? styles.statusRejected : styles.statusPending)
              }}>
                {event.status || "pending"}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && eventToDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Hi, {organizerName || localStorage.getItem("userName") || "Organizer"}</h2>
            <p style={styles.modalMessage}>Are you sure delete this event?</p>
            <h3 style={styles.eventName}>{eventToDelete.title}</h3>

            <div style={styles.modalButtons}>
              <button
                style={styles.confirmButton}
                onClick={confirmDelete}
              >
                ✓ Yes, Delete
              </button>
              <button
                style={styles.cancelButton}
                onClick={cancelDelete}
              >
                ✗ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
  },

  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },

  modalContent: {
    background: "white",
    borderRadius: "15px",
    padding: "40px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    maxWidth: "450px",
    width: "90%",
    textAlign: "center",
    animation: "slideIn 0.3s ease-out"
  },

  modalTitle: {
    margin: "0 0 15px 0",
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333"
  },

  modalMessage: {
    margin: "10px 0",
    fontSize: "16px",
    color: "#666"
  },

  eventName: {
    margin: "15px 0",
    fontSize: "18px",
    color: "#ff4d4d",
    fontWeight: "600",
    wordBreak: "break-word"
  },

  modalButtons: {
    display: "flex",
    gap: "15px",
    marginTop: "30px",
    justifyContent: "center"
  },

  confirmButton: {
    background: "#ff4d4d",
    color: "white",
    border: "none",
    padding: "12px 30px",
    borderRadius: "25px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "background 0.2s ease"
  },

  cancelButton: {
    background: "#4caf50",
    color: "white",
    border: "none",
    padding: "12px 30px",
    borderRadius: "25px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "background 0.2s ease"
  },
  statusBadge: {
    position: "absolute",
    top: "10px",
    right: "10px",
    padding: "5px 12px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
  },
  statusPending: {
    background: "#ffcc00",
    color: "#333",
  },
  statusApproved: {
    background: "#00ff88",
    color: "#000",
  },
  statusRejected: {
    background: "#ff4d4d",
    color: "#fff",
  },
  card: {
    background: "white",
    borderRadius: "15px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    transition: "transform 0.2s ease-in-out",
    position: "relative" // Added for absolute badge
  }
};

export default OrganizerDashboard;
