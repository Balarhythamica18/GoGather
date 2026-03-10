import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  Smartphone,
  Landmark,
  ShieldCheck,
  ArrowRight,
  Shield,
  CheckCircle2,
  Fingerprint,
  Lock,
  ChevronLeft,
  User,
  AlertCircle,
  HelpCircle,
  Check
} from "lucide-react";
import { API_BASE_URL } from "../config";
import "./PaymentPage.css";

const GPayModal = ({ isOpen, onClose, onConfirm, amount }) => {
  if (!isOpen) return null;
  return (
    <div className="gpay-overlay">
      <div className="gpay-modal animate-pop-in">
        <div className="gpay-header">
          <img src="/download.png" alt="GPay" className="gpay-logo-img" />
          <button onClick={onClose} className="close-gpay">&times;</button>
        </div>

        <div className="gpay-content">
          <div className="gpay-amount-box">
            <span className="pay-to">Paying GoGather Tickets</span>
            <div className="gpay-total">
              <span className="cur">₹</span>
              <span className="num">{amount}</span>
            </div>
          </div>

          <div className="gpay-selector">
            <div className="bank-pill">
              <div className="bank-avatar">H</div>
              <div className="bank-text">
                <p className="bank-name">HDFC Bank •••• 1234</p>
                <p className="type">Savings Account</p>
              </div>
              <div className="bank-check"><Check size={14} /></div>
            </div>
          </div>

          <div className="gpay-auth-section">
            <div className="finger-box">
              <Fingerprint size={48} className="finger-icon" />
              <div className="pulse-ring"></div>
            </div>
            <p>Verify with fingerprint to complete</p>
          </div>
        </div>

        <div className="gpay-footer">
          <button className="gpay-proceed-btn" onClick={onConfirm}>
            Proceed to Pay
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [isGPayOpen, setIsGPayOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Card State
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvc: "", name: "" });

  const stored = JSON.parse(localStorage.getItem("bookingData") || "null");
  const bookingData = location.state?.bookingData || stored;

  useEffect(() => {
    if (!bookingData) {
      navigate("/events");
    }
  }, [bookingData, navigate]);

  if (!bookingData) return null;

  const steps = [
    "Establishing secure session...",
    "Validating secure portal...",
    "Finalizing ticket generation..."
  ];

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardInput = (e) => {
    const { name, value } = e.target;
    if (name === 'number') {
      setCardData({ ...cardData, [name]: formatCardNumber(value) });
    } else if (name === 'expiry') {
      let v = value.replace(/\//g, '').replace(/[^0-9]/gi, '');
      if (v.length >= 2) v = v.slice(0, 2) + ' / ' + v.slice(2, 4);
      setCardData({ ...cardData, [name]: v });
    } else {
      setCardData({ ...cardData, [name]: value });
    }
  };

  const finalizePayment = async (method) => {
    setIsProcessing(true);
    setIsGPayOpen(false);

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(i);
      await new Promise(r => setTimeout(r, 1200));
    }

    try {
      const verifyRes = await fetch(`${API_BASE_URL}/api/bookings/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
          paymentId: "PAY_SIM_" + Math.random().toString(36).substr(2, 9),
          userEmail: bookingData.userEmail,
          paymentMethod: method
        }),
      });
      const verifyData = await verifyRes.json();

      setShowSuccess(true);
      await new Promise(r => setTimeout(r, 2000));

      localStorage.removeItem("bookingData");
      navigate("/confirmation", { state: { booking: verifyData, isSimulated: true } });
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert("Payment failed. Please try again.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    finalizePayment("card");
  };

  return (
    <div className="payment-root">
      {/* FULL SCREEN OVERLAY - MOVED TO TOP OF ROOT */}
      {isProcessing && (
        <div className="proc-overlay animate-fade-in">
          {!showSuccess ? (
            <div className="proc-content animate-pop-in">
              <div className="premium-loader">
                <div className="l-ring"></div>
                <div className="l-ring"></div>
                <div className="l-ring"></div>
                <div className="l-center"><Lock size={40} strokeWidth={1.5} /></div>
              </div>
              <h3 className="proc-title">{steps[processingStep]}</h3>
              <p className="proc-sub">Encryption active. Do not refresh this page.</p>
            </div>
          ) : (
            <div className="success-overlay animate-pop-in">
              <div className="success-vessel">
                <div className="draw-circle">
                  <Check size={80} strokeWidth={4} />
                </div>
              </div>
              <h2 className="success-title">Payment Verified</h2>
              <p className="success-sub">Redirecting to your digital tickets...</p>
            </div>
          )}
        </div>
      )}

      <GPayModal
        isOpen={isGPayOpen}
        onClose={() => setIsGPayOpen(false)}
        onConfirm={() => finalizePayment("gpay")}
        amount={bookingData.amount}
      />

      <div className="p-container">
        <main className="p-main-section">
          <div className="p-top-bar">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
            <div className="secure-tag">
              <Shield size={14} />
              Secure Checkout
            </div>
          </div>

          <h1 className="p-title">Payment Method</h1>
          <p className="p-subtitle">Select your preferred way to complete the booking</p>

          <div className="p-tabs">
            <button
              className={`p-tab-item ${activeTab === 'card' ? 'active' : ''}`}
              onClick={() => setActiveTab('card')}
            >
              <div className="tab-icon"><CreditCard size={20} /></div>
              <span className="tab-label">Card</span>
            </button>
            <button
              className={`p-tab-item ${activeTab === 'upi' ? 'active' : ''}`}
              onClick={() => setActiveTab('upi')}
            >
              <div className="tab-icon"><Smartphone size={20} /></div>
              <span className="tab-label">UPI</span>
            </button>
            <button
              className={`p-tab-item ${activeTab === 'net' ? 'active' : ''}`}
              onClick={() => setActiveTab('net')}
            >
              <div className="tab-icon"><Landmark size={20} /></div>
              <span className="tab-label">Net Banking</span>
            </button>
          </div>

          <div className="p-form-vessel">
            {activeTab === 'card' && (
              <form onSubmit={handleSubmit} className="p-checkout-form">
                <div className="p-input-box">
                  <label>Cardholder Name</label>
                  <div className="p-field">
                    <User size={18} className="field-icon" />
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter name on card"
                      value={cardData.name}
                      onChange={handleCardInput}
                      required
                    />
                  </div>
                </div>

                <div className="p-input-box">
                  <label>Card Number</label>
                  <div className="p-field">
                    <CreditCard size={18} className="field-icon" />
                    <input
                      type="text"
                      name="number"
                      placeholder="XXXX XXXX XXXX XXXX"
                      maxLength="19"
                      value={cardData.number}
                      onChange={handleCardInput}
                      required
                    />
                  </div>
                </div>

                <div className="p-field-row">
                  <div className="p-input-box">
                    <label>Expiry Date</label>
                    <div className="p-field no-icon">
                      <input
                        type="text"
                        name="expiry"
                        placeholder="MM / YY"
                        maxLength="7"
                        value={cardData.expiry}
                        onChange={handleCardInput}
                        required
                      />
                    </div>
                  </div>
                  <div className="p-input-box">
                    <label>CVV</label>
                    <div className="p-field">
                      <Lock size={18} className="field-icon" />
                      <input
                        type="password"
                        name="cvc"
                        placeholder="•••"
                        maxLength="3"
                        value={cardData.cvc}
                        onChange={handleCardInput}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="p-submit-btn">
                  <span>Pay ₹{bookingData.amount}</span>
                  <ArrowRight size={20} className='arr' />
                </button>
              </form>
            )}

            {activeTab === 'upi' && (
              <div className="upi-vessel">
                <div className="vpa-box">
                  <label>Pay with UPI VPA</label>
                  <div className="vpa-field">
                    <Smartphone size={18} className="v-icon" />
                    <input type="text" placeholder="yourname@upi" />
                    <button className="vpa-btn">Pay Now</button>
                  </div>
                </div>

                <div className="sep">
                  <div className="line"></div>
                  <span>OR QUICK PAY</span>
                  <div className="line"></div>
                </div>

                <div className="upi-grid-view">
                  <div className="upi-cell" onClick={() => setIsGPayOpen(true)}>
                    <div className="upi-logo-box">
                      <img src="/download.png" alt="GPay" />
                    </div>
                    <div className="upi-name">Google Pay</div>
                  </div>
                  <div className="upi-cell" onClick={() => finalizePayment("phonepe")}>
                    <div className="upi-logo-box">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" />
                    </div>
                    <div className="upi-name">PhonePe</div>
                  </div>
                  <div className="upi-cell" onClick={() => finalizePayment("paytm")}>
                    <div className="upi-logo-box">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" />
                    </div>
                    <div className="upi-name">Paytm</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'net' && (
              <div className="nb-vessel">
                <label>Popular Banks</label>
                <div className="nb-grid">
                  {[
                    { name: 'HDFC', icon: 'H', color: '#1a73e8' },
                    { name: 'ICICI', icon: 'I', color: '#f58220' },
                    { name: 'SBI', icon: 'S', color: '#003366' },
                    { name: 'Axis', icon: 'A', color: '#9d0a44' },
                    { name: 'Kotak', icon: 'K', color: '#ec1c24' },
                    { name: 'Yes', icon: 'Y', color: '#005a9c' }
                  ].map(bank => (
                    <div key={bank.name} className="nb-card" onClick={() => finalizePayment("netbanking")}>
                      <div className="nb-avatar" style={{ backgroundColor: bank.color }}>{bank.icon}</div>
                      <span>{bank.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-security-badges">
            <div className="s-badge">
              <ShieldCheck size={16} />
              <span>100% Encrypted</span>
            </div>
            <div className="s-badge">
              <ShieldCheck size={16} />
              <span>PCI DSS Compliant</span>
            </div>
          </div>
        </main>

        <aside className="p-sidebar">
          <div className="p-order-card">
            <div className="p-order-header">
              <div className="g-logo">GoGather</div>
              <div className="p-order-id">Order Ref: {bookingData.bookingId?.slice(-6).toUpperCase()}</div>
            </div>

            <div className="p-amount-vessel">
              <label>Total to Pay</label>
              <h1>₹{bookingData.amount}</h1>
            </div>

            <div className="p-divider"></div>

            <div className="p-event-card">
              <h4 className="p-event-title">{bookingData.eventName}</h4>
              <div className="p-event-details">
                <div className="p-row">
                  <span>Quantity:</span>
                  <strong>{bookingData.seats?.length || bookingData.ticketCount} Units</strong>
                </div>
                <div className="p-row">
                  <span>Seats:</span>
                  <strong className="seat-list">{bookingData.seats?.join(", ") || "General Admission"}</strong>
                </div>
              </div>
            </div>

            <div className="p-notice">
              <AlertCircle size={16} />
              <p>Your tickets are reserved for 10:00 minutes. Please complete payment within this window.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PaymentPage;
