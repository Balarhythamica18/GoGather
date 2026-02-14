import React, { useState } from "react";
import axios from "axios";
import "./Auth.css";

const Register = () => {
  const [role, setRole] = useState("user");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");

  const validatePassword = (password) => {
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    if (!validatePassword(form.password)) {
      return setError(
        "Password must be 8+ characters, include one number and one special character"
      );
    }

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        ...form,
        role
      });

      alert("Registered Successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h2>Create Account 🚀</h2>

        {/* Role Tabs */}
        <div className="role-tabs">
          <button
            className={role === "user" ? "active" : ""}
            onClick={() => setRole("user")}
            type="button"
          >
            User
          </button>
          <button
            className={role === "organizer" ? "active" : ""}
            onClick={() => setRole("organizer")}
            type="button"
          >
            Organizer
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <input
            type="password"
            placeholder="Confirm Password"
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            required
          />

          {error && <p className="error-text">{error}</p>}

        <button className="auth-btn">
  Login
</button>

        </form>

      </div>
    </div>
  );
};

export default Register;
