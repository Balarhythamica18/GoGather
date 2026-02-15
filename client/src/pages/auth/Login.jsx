import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

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

      // Store token + name
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userName", res.data.name);

      setSuccess("Login Successful 🎉 Redirecting...");

      setTimeout(() => {
        if (res.data.role === "admin") {
          navigate("/admin/dashboard");
        } else if (res.data.role === "organizer") {
          navigate("/dashboard");
        } else {
          navigate("/home");
        }
      }, 1500);

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

          <input
            type="password"
            placeholder="Password"
            required
            onChange={(e)=>setForm({...form,password:e.target.value})}
          />

          <button type="submit" className="auth-btn">
            Login
          </button>
        </form>

        <p className="auth-switch">
          Don’t have an account?{" "}
          <Link to="/register">Register</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
