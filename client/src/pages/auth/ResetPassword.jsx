import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../config";
import "./auth.css";

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        } else {
            navigate("/forgot-password");
        }
    }, [location, navigate]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;
        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const otpValue = otp.join("");

        if (otpValue.length < 6) return setError("Enter 6-digit code");
        if (newPassword !== confirmPassword) return setError("Passwords do not match");
        if (newPassword.length < 8) return setError("Password must be at least 8 characters");

        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
                email,
                otp: otpValue,
                newPassword
            });
            toast.success(res.data.message);
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <button onClick={() => navigate("/forgot-password")} className="back-btn" style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: "5px", color: "#666", cursor: "pointer", marginBottom: "20px", fontSize: "14px" }}>
                    <ArrowLeft size={16} /> Back
                </button>

                <h2>Reset Password</h2>
                <p className="subtitle">Enter the code sent to <b>{email}</b> and your new password.</p>

                {error && <div className="error-popup">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="otp-input-container" style={{ display: "flex", gap: "8px", justifyContent: "center", margin: "20px 0" }}>
                        {otp.map((data, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength="1"
                                value={data}
                                onChange={(e) => handleChange(e.target, index)}
                                onFocus={(e) => e.target.select()}
                                style={{ width: "40px", height: "45px", fontSize: "18px", textAlign: "center", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                            />
                        ))}
                    </div>

                    <div className="input-wrapper">
                        <Lock className="input-icon" size={20} />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="New Password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button type="button" className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="input-wrapper" style={{ marginTop: "15px" }}>
                        <Lock className="input-icon" size={20} />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm New Password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading} style={{ marginTop: "20px" }}>
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
