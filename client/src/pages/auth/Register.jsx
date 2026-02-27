import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-hot-toast";
import "./Auth.css";

const Register = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState("user");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      await axios.post("/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role
      });

      setSuccess("Account created successfully! Please verify your email.");

      setTimeout(() => {
        navigate("/verify-otp", { state: { email: form.email } });
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/google-login", {
        token: credentialResponse.credential,
        role: role // Use the currently selected role
      });

      if (!res.data?.token || !res.data?.user) {
        setError("Invalid server response");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("name", res.data.user.name || "");
      localStorage.setItem("role", res.data.user.role || "");

      window.dispatchEvent(new Event("storageChange"));
      setSuccess("Account verified with Google! Redirecting...");

      setTimeout(() => {
        if (res.data.user.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (res.data.user.role === "organizer") {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Google Signup failed");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="subtitle">Join the community and start exploring events.</p>

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
          <div className="input-wrapper">
            <User className="input-icon" size={20} />
            <input
              type="text"
              placeholder="Full Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="input-wrapper">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="input-wrapper">
            <Lock className="input-icon" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create Password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="input-wrapper">
            <Lock className="input-icon" size={20} />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              required
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />
            <button
              type="button"
              className="eye-icon"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Register Now"}
          </button>
        </form>

        <div className="google-auth-separator">
          <hr />
          <span>OR</span>
        </div>

        <div className="google-login-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError("Google Registration Failed");
              toast.error("Google Registration Failed");
            }}
            theme="outline"
            shape="pill"
            text="signup_with"
            size="large"
            width="100%"
          />
        </div>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login here</Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
