import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";

const Register = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState("user");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validatePassword = (password) => {
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

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
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role
      });

      setSuccess("Registered Successfully 🎉 Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h2>Create Account</h2>

        {success && <div className="success-popup">{success}</div>}
        {error && <div className="error-popup">{error}</div>}

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
            required
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            type="email"
            placeholder="Email Address"
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            required
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
          />

          <button type="submit" className="auth-btn">
            Register
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
