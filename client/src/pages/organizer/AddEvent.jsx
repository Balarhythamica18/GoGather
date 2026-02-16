import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { addressOptions, getAddressesByLocation } from "../../data/addressOptions";

const AddEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    date: "",
    time: "",
    title: "",
    location: "",
    address: "",
    category: "",
    customCategory: "",
    price: "",
    description: "",
    aboutEvent: "",
    keyHighlights: [],
    organizerName: "",
    organizerEmail: "",
    organizerPhone: "",
  });

  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/events/${id}`);
        const ev = res.data;

        // Build an ISO date for the date input if month+date exist
        let isoDate = "";
        if (ev.month && ev.date) {
          isoDate = `${ev.month}-${String(ev.date).padStart(2, "0")}`;
        }

        setForm({
          date: isoDate,
          time: ev.time || "",
          title: ev.title || "",
          location: ev.location || "",
          address: ev.address || "",
          category: ev.category || "",
          customCategory: "",
          price: ev.price || "",
          description: ev.description || "",
          aboutEvent: ev.aboutEvent || "",
          keyHighlights: ev.keyHighlights || [],
          image: ev.image || "",
          organizerName: ev.organizerDetails?.name || "",
          organizerEmail: ev.organizerDetails?.contactEmail || "",
          organizerPhone: ev.organizerDetails?.contactPhone || "",
        });
        setImage(null);
      } catch (err) {
        console.error("Error loading event for edit:", err);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleHighlightsChange = (e) => {
    setForm((f) => ({ ...f, keyHighlights: e.target.value.split(",").map(h => h.trim()) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    const finalCategory = form.category === "Other" ? form.customCategory : form.category;

    // Append all simple fields except keyHighlights (handled separately)
    Object.keys(form).forEach((key) => {
      if (key === "keyHighlights" || key === "customCategory") return;
      formData.append(key, form[key]);
    });

    formData.set("category", finalCategory);

    // Append highlights individually
    (form.keyHighlights || []).forEach((highlight) => formData.append("keyHighlights", highlight));

    if (image) formData.append("image", image);

    // If no new file selected, ensure we still send existing image URL so server preserves it
    if (!image && form.image) {
      formData.set("image", form.image);
    }

    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: { "Content-Type": "multipart/form-data", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      };

      if (id) {
        await axios.put(`http://localhost:5000/api/events/${id}`, formData, config);
        alert("Event updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/events", formData, config);
        alert("Event created successfully!");
      }
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Error saving event: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.topBar}>
          <h1>{id ? "Edit Event" : "Create New Event"}</h1>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}> 
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Event Details */}
          <div style={styles.section}>
            <h2>Event Details</h2>

            <div style={styles.grid}>

              <input name="title" placeholder="Event Title" onChange={handleChange} required style={styles.input} value={form.title} />

              <div style={styles.iconInput}>
                <span>📅</span>
                <input type="date" name="date" onChange={handleChange} required style={styles.iconField} value={form.date} />
              </div>

              <div style={styles.iconInput}>
                <span>⏰</span>
                <input type="time" name="time" onChange={handleChange} required style={styles.iconField} value={form.time} />
              </div>

              <input name="location" placeholder="Location" onChange={handleChange} required style={styles.input} value={form.location} />

              {/* Address Dropdown (dynamic based on location) */}
              {form.location && getAddressesByLocation(form.location).length > 0 ? (
                <select
                  name="address"
                  onChange={handleChange}
                  required
                  style={styles.input}
                  value={form.address}
                >
                  <option value="">Select Address</option>
                  {getAddressesByLocation(form.location).map((addr, idx) => (
                    <option key={idx} value={addr}>
                      {addr}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name="address"
                  placeholder="Address"
                  onChange={handleChange}
                  required
                  style={styles.input}
                  value={form.address}
                />
              )}

              {/* Category Dropdown */}
              <select name="category" onChange={handleChange} required style={styles.input} value={form.category}>
                <option value="">Select Category</option>
                <option>Food</option>
                <option>Rawstories</option>
                <option>TheatreDrama</option>
                <option>Comedy</option>
                <option>Sports</option>
                <option>Concert</option>
                <option>Other</option>
              </select>

              {form.category === "Other" && (
                <input name="customCategory" placeholder="Enter Custom Category" onChange={handleChange} required style={styles.input} value={form.customCategory} />
              )}

              <input name="price" placeholder="Price" onChange={handleChange} style={styles.input} value={form.price} />
            </div>

            <textarea name="description" placeholder="Event Description" onChange={handleChange} style={styles.textarea} value={form.description} />

            <textarea name="aboutEvent" placeholder="About Event (Additional Details)" onChange={handleChange} style={styles.textarea} value={form.aboutEvent} />

            {/* Properly aligned highlights */}
            <div style={{ marginTop: "15px" }}>
              <label style={styles.label}>Key Highlights (comma separated)</label>
              <input name="keyHighlights" placeholder="Music, Free Food, Celebrity Guest..." onChange={handleHighlightsChange} style={{ ...styles.input, width: "100%" }} value={Array.isArray(form.keyHighlights) ? form.keyHighlights.join(', ') : form.keyHighlights} />
            </div>

            <div style={{ marginTop: "15px" }}>
              <label style={styles.label}>Upload Event Image</label>
              {image ? (
                <div style={{ marginBottom: 8 }}>
                  <img src={URL.createObjectURL(image)} alt="preview" style={{ maxWidth: 200, borderRadius: 8 }} />
                </div>
              ) : (
                form.image && (
                  <div style={{ marginBottom: 8 }}>
                    <img src={form.image} alt="current" style={{ maxWidth: 200, borderRadius: 8 }} />
                  </div>
                )
              )}

              <input type="file" onChange={(e) => setImage(e.target.files[0])} />
            </div>
          </div>

          {/* Organizer Details */}
          <div style={styles.section}>
            <h2>Organizer Details</h2>
            <div style={styles.grid}>
              <input name="organizerName" placeholder="Name" onChange={handleChange} required style={styles.input} value={form.organizerName} />
              <input name="organizerEmail" placeholder="Email" onChange={handleChange} style={styles.input} value={form.organizerEmail} />
              <input name="organizerPhone" placeholder="Phone" onChange={handleChange} style={styles.input} value={form.organizerPhone} />
            </div>
          </div>

          <button type="submit" style={styles.submitBtn}>Save Event</button>

        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px",
    background: "linear-gradient(135deg, #6a11cb, #2575fc)",
    display: "flex",
    justifyContent: "center",
  },
  card: {
    background: "white",
    padding: "40px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "1000px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "30px",
  },
  backBtn: {
    padding: "8px 15px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "30px"
  },
  section: {
    background: "#f9f9f9",
    padding: "20px",
    borderRadius: "15px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px"
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  textarea: {
    marginTop: "15px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    minHeight: "100px",
    width: "100%"
  },
  iconInput: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "0 10px",
  },
  iconField: {
    border: "none",
    padding: "12px",
    outline: "none",
    width: "100%"
  },
  label: {
    fontWeight: "bold",
    display: "block",
    marginBottom: "5px"
  },
  submitBtn: {
    padding: "15px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(90deg, #6a11cb, #2575fc)",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer"
  }
};

export default AddEvent;
