import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../config";
import "./auth.css";

const Login = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState("user");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Use relative path for better environment compatibility
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, form);

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

      setSuccess("Welcome back! Redirecting...");

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
      if (err.response?.status === 401 && err.response?.data?.unverified) {
        setError(err.response.data.message);
        setTimeout(() => {
          navigate("/verify-otp", { state: { email: form.email } });
        }, 2000);
        return;
      }
      setError(err.response?.data?.message || "Authentication failed. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/api/auth/google-login`, {
        token: credentialResponse.credential
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
      setSuccess("Welcome back! Redirecting...");

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
      if (err.response?.status === 401 && err.response?.data?.unverified) {
        setError(err.response.data.message);
        setTimeout(() => {
          navigate("/verify-otp", { state: { email: err.response.data.email } });
        }, 2000);
        return;
      }
      setError(err.response?.data?.message || "Google Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${role === "organizer" ? "organizer-card" : ""}`}>
        <h2>{role === "organizer" ? "Organizer Login" : "Login"}</h2>
        <p className="subtitle">
          {role === "organizer" 
            ? "Access your organizer dashboard to manage events." 
            : "Welcome back! Please enter your details."}
        </p>

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
          {/* Email */}
          <div className="input-wrapper">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              placeholder={role === "organizer" ? "Business Email (e.g., demo@company.com)" : "Email Address"}
              required
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>

          {/* Password */}
          <div className="input-wrapper">
            <Lock className="input-icon" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder={role === "organizer" ? "Organizer Password" : "Password"}
              required
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
            <button
              type="button"
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Authenticating..." : role === "organizer" ? "Organizer Login" : "Login"}
          </button>
        </form>

        <div style={{ textAlign: "right", marginTop: "10px" }}>
          <Link to="/forgot-password" style={{ fontSize: "14px", color: "#6366f1", textDecoration: "none" }}>
            Forgot Password?
          </Link>
        </div>

        {role === "user" && (
          <>
            <div className="google-auth-separator">
              <hr />
              <span>OR</span>
            </div>

            <div className="google-login-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError("Google Login Failed");
                  toast.error("Google Login Failed");
                }}
                use_fedcm_for_prompt={true}
                theme="outline"
                shape="pill"
                text="continue_with"
                size="large"
                width="100%"
              />
            </div>
          </>
        )}

        <p className="auth-switch">
          Don’t have an account? <Link to="/register">Create one for free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;