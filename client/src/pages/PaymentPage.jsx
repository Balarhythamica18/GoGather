import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard, Smartphone, Landmark, ShieldCheck, ArrowRight, Shield, CheckCircle2 } from "lucide-react";
import "./PaymentPage.css";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const stored = JSON.parse(localStorage.getItem("bookingData") || "null");
  const bookingData = location.state?.bookingData || stored;

  useEffect(() => {
    if (!bookingData) {
      navigate("/events");
    }
  }, [bookingData, navigate]);

  if (!bookingData) return null;

  const steps = ["Initiating secure session...", "Authorizing transaction...", "Finalizing booking details..."];

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulation of steps
    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(i);
      await new Promise(r => setTimeout(r, 1200));
    }

    try {
      // Simulate API verification
      const verifyRes = await fetch("/api/bookings/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingData.bookingId, // REAL ID from database
          paymentId: "PAY_SIM_" + Math.random().toString(36).substr(2, 9),
          userEmail: bookingData.userEmail,
        }),
      });
      const verifyData = await verifyRes.json();
      localStorage.removeItem("bookingData");
      navigate("/confirmation", { state: { booking: verifyData, isSimulated: true } });
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert("Payment simulation failed. In a real app, this would be a real transaction.");
    }
  };

  return (
    <div className="payment-container">
      {isProcessing && (
        <div className="processing-overlay">
          <div className="spinner"></div>
          <h3>{steps[processingStep]}</h3>
          <p>Please do not refresh or close this window.</p>
        </div>
      )}

      <div className="payment-card">
        <div className="payment-summary">
          <div className="brand-badge">
            <ShieldCheck size={28} />
            GoGather Secure
          </div>

          <div className="summary-header">
            <h2>Amount Due</h2>
            <div className="amount">
              <span className="currency">₹</span>
              {bookingData.amount}
            </div>
          </div>

          <div className="booking-details">
            <div className="detail-item">
              <label>Event</label>
              <p>{bookingData.eventName || "Event Premium Ticket"}</p>
            </div>
            <div className="detail-item">
              <label>Seats</label>
              <p>{bookingData.seats?.join(", ") || `${bookingData.ticketCount} Tickets`}</p>
            </div>
            <div className="detail-item">
              <label>Category</label>
              <p>Premium Experience</p>
            </div>
          </div>

          <div className="security-badge">
            <Shield size={20} color="#db2777" />
            <div>
              <strong>Bank-Grade Security</strong>
              <p style={{ margin: 0, opacity: 0.8 }}>End-to-end encrypted payments</p>
            </div>
          </div>
        </div>

        <div className="payment-methods">
          <h1>Payment Method</h1>
          <p>Choose your preferred way to pay securely.</p>

          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === "card" ? "active" : ""}`}
              onClick={() => setActiveTab("card")}
            >
              <CreditCard size={20} />
              Card
            </button>
            <button
              className={`tab-btn ${activeTab === "upi" ? "active" : ""}`}
              onClick={() => setActiveTab("upi")}
            >
              <Smartphone size={20} />
              UPI
            </button>
            <button
              className={`tab-btn ${activeTab === "net" ? "active" : ""}`}
              onClick={() => setActiveTab("net")}
            >
              <Landmark size={20} />
              Net Banking
            </button>
          </div>

          <form onSubmit={handlePayment} className="payment-form">
            {activeTab === "card" && (
              <>
                <div className="input-group">
                  <label>Cardholder Name</label>
                  <input type="text" placeholder="John Doe" required />
                </div>
                <div className="input-group">
                  <label>Card Number</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="XXXX XXXX XXXX XXXX"
                      maxLength="19"
                      required
                      style={{ width: '100%' }}
                    />
                    <CreditCard size={18} style={{ position: 'absolute', right: '12px', top: '14px', color: '#94a3b8' }} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>Expiry Date</label>
                    <input type="text" placeholder="MM / YY" maxLength="5" required />
                  </div>
                  <div className="input-group">
                    <label>CVV</label>
                    <input type="password" placeholder="***" maxLength="3" required />
                  </div>
                </div>
              </>
            )}

            {activeTab === "upi" && (
              <>
                <div className="input-group">
                  <label>Enter UPI ID</label>
                  <input type="text" placeholder="username@bank" required />
                </div>
                <div style={{ textAlign: 'center', margin: '1rem 0', color: '#94a3b8' }}>OR SELECT APP</div>
                <div className="upi-grid">
                  <div className="upi-app">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Pay_GPay_Logo.svg" alt="GPay" />
                    <span>GPay</span>
                  </div>
                  <div className="upi-app">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" />
                    <span>PhonePe</span>
                  </div>
                  <div className="upi-app">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" />
                    <span>Paytm</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === "net" && (
              <div className="input-group">
                <label>Select Your Bank</label>
                <select required>
                  <option value="">Choose a bank...</option>
                  <option value="hdfc">HDFC Bank</option>
                  <option value="icici">ICICI Bank</option>
                  <option value="sbi">State Bank of India</option>
                  <option value="axis">Axis Bank</option>
                  <option value="kotak">Kotak Mahindra Bank</option>
                </select>
              </div>
            )}

            <button type="submit" className="pay-button">
              Pay ₹{bookingData.amount}
              <ArrowRight size={20} />
            </button>
          </form>

          <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem' }}>
            <CheckCircle2 size={14} />
            Your transaction is 100% safe and secure
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
