import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Auth.css";

const Login = ({ setUser }) => { // ✅ receive setUser from App/Navbar
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
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

      // Save auth data
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userName", res.data.name);
      if (res.data.role) localStorage.setItem("role", res.data.role);

      setSuccess("Login Successful 🎉"); // show immediately

      // Update Navbar user immediately
      setUser({ name: res.data.name, role: res.data.role });

      // Redirect based on role
      if (res.data.role === "admin") {
        navigate("/admin/dashboard");
      } else if (res.data.role === "organizer") {
        navigate("/dashboard");
      } else {
        navigate("/home");
      }
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
          <input
            type="email"
            placeholder="Email"
            required
            onChange={(e)=>setForm({...form,email:e.target.value})}
          />

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              onChange={(e)=>setForm({...form,password:e.target.value})}
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