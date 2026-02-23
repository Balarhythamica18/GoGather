import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        form
      );

      // ✅ Ensure response has token + user
      if (!res.data?.token || !res.data?.user) {
        setError("Invalid server response");
        return;
      }

      // ⭐ SAVE TOKEN
      localStorage.setItem("token", res.data.token);

      // ⭐ SAVE FULL USER OBJECT (IMPORTANT FOR SeatLayout)
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Optional extras for Navbar
      localStorage.setItem("name", res.data.user.name || "");
      localStorage.setItem("role", res.data.user.role || "");

      // ⭐ Dispatch event so Navbar updates immediately
      window.dispatchEvent(new Event("storageChange"));

      setSuccess("Login Successful 🎉 Redirecting...");

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1200);

    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>

        {success && <div className="success-popup">{success}</div>}
        {error && <div className="error-popup">{error}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          {/* Password */}
          <div className="password-box">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />

            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit" className="auth-btn">
            Login
          </button>
        </form>

        <p className="auth-switch">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;