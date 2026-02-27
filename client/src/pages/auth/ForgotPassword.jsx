import React, { useState } from "react";
import axios from "axios";
import { Mail, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../config";
import "./auth.css";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
            toast.success(res.data.message);
            navigate("/reset-password", { state: { email } });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send reset code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <Link to="/login" className="back-btn" style={{ display: "flex", alignItems: "center", gap: "5px", color: "#666", textDecoration: "none", marginBottom: "20px", fontSize: "14px" }}>
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                <h2>Forgot Password?</h2>
                <p className="subtitle">Enter your email and we'll send you a 6-digit code to reset your password.</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                        <Mail className="input-icon" size={20} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Code"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
