import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    try {
      await axios.post(`${API_BASE_URL}/api/contact`, formData);
      setSuccess("Your message has been sent successfully! Your Team will Contact you soon, Thank you.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (error) {
      console.error("Submission error:", error);
      const serverDetails = error.response?.data?.details;
      const serverError = error.response?.data?.error;
      const errorMsg = serverDetails || serverError || "Connection error. Please check your internet or try again later.";

      alert(`Submission Failed: ${errorMsg}`);
    }

    setLoading(false);
  };

  return (
    <>
      <div className="contact-wrapper">
        <div className="contact-card">
          <h1>Contact Support</h1>
          <p className="subtitle">
            Our team is here to help you with bookings and inquiries.
          </p>

          {success && <div className="success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                name="message"
                rows="4"
                required
                value={formData.message}
                onChange={handleChange}
              ></textarea>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>

      <style>{`


/* Page Wrapper */
.contact-wrapper {
  min-height: calc(100vh - 80px); /* Adjust if navbar height differs */
  background: #f3f4f8;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 120px 20px 60px;
}

/* Card */
.contact-card {
  background: #ffffff;
  width: 100%;
  max-width: 520px;
  padding: 32px;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* Title */
.contact-card h1 {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

/* Subtitle */
.subtitle {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 25px;
}

/* Success Message */
.success {
  background: #e6fffa;
  color: #047857;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 18px;
  font-size: 14px;
  text-align: center;
}

/* Form Layout */
form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Row (Name + Email) */
.row {
  display: flex;
  gap: 14px;
  width: 100%;
}

/* Form Group */
.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Labels */
label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 5px;
}

/* Inputs & Textarea */
input,
textarea {
  width: 100%;
  max-width: 100%;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  transition: all 0.2s ease;
  background: #fafafa;
}

/* Textarea Specific */
textarea {
  min-height: 120px;
  resize: vertical;
}

/* Focus Effect */
input:focus,
textarea:focus {
  border-color: var(--primary-blue);
  background: #ffffff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(11, 15, 91, 0.15);
}

/* Button */
button {
  background: var(--primary-gradient);
  color: #ffffff;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 6px;
}

button:hover {
  background: var(--primary-hover-gradient);
  transform: translateY(-1px);
}



button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .contact-wrapper {
    padding: 100px 16px 50px;
  }

  .contact-card {
    padding: 24px;
  }

  .row {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .contact-wrapper {
    padding: 90px 12px 40px;
  }

  .contact-card {
    padding: 20px;
  }

  .contact-card h1 {
    font-size: 20px;
  }
}

      `}</style>
    </>
  );
}
