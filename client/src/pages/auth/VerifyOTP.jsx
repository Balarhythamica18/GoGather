import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import "./Auth.css";

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Get email from location state (passed from Register or Login)
        if (location.state?.email) {
            setEmail(location.state.email);
        } else {
            // If no email in state, redirect to login
            navigate("/login");
        }
    }, [location, navigate]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const otpValue = otp.join("");

        if (otpValue.length < 6) {
            return setError("Please enter the 6-digit code");
        }

        setLoading(true);
        try {
            const res = await axios.post("/api/auth/verify-otp", {
                email,
                otp: otpValue
            });

            toast.success(res.data.message || "Email verified successfully!");

            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Verification failed. Please try again.");
            toast.error(err.response?.data?.message || "Verification failed");
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            const res = await axios.post("/api/auth/resend-otp", { email });
            toast.success(res.data.message || "OTP resent to your email");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to resend OTP");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <button
                    className="back-btn"
                    onClick={() => navigate("/login")}
                    style={{
                        background: "none",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        color: "#666",
                        cursor: "pointer",
                        marginBottom: "20px",
                        fontSize: "14px"
                    }}
                >
                    <ArrowLeft size={16} /> Back to Login
                </button>

                <h2>Verify Email</h2>
                <p className="subtitle">
                    We've sent a 6-digit verification code to <span style={{ fontWeight: "600", color: "#6366f1" }}>{email}</span>
                </p>

                {error && <div className="error-popup">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="otp-input-container" style={{ display: "flex", gap: "10px", justifyContent: "center", margin: "30px 0" }}>
                        {otp.map((data, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength="1"
                                value={data}
                                onChange={(e) => handleChange(e.target, index)}
                                onFocus={(e) => e.target.select()}
                                style={{
                                    width: "45px",
                                    height: "50px",
                                    fontSize: "20px",
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    borderRadius: "8px",
                                    border: "2px solid #e0e0e0",
                                    outline: "none",
                                    transition: "all 0.3s ease",
                                    color: "#1e293b",
                                    padding: "0"
                                }}
                                className="otp-input"
                            />
                        ))}
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </form>

                <div className="resend-container" style={{ marginTop: "20px", textAlign: "center" }}>
                    <p style={{ color: "#666", fontSize: "14px" }}>
                        Didn't receive the code?{" "}
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#6366f1",
                                fontWeight: "600",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px"
                            }}
                        >
                            {resending ? <RefreshCw className="animate-spin" size={14} /> : "Resend OTP"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
