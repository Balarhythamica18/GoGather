import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("bookingData") || "null");
  const bookingData = location.state?.bookingData || stored;

  if (!bookingData) return <p>No booking info found.</p>;

  // Dynamically load Razorpay checkout script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Failed to load Razorpay SDK. Try again.");
      return;
    }

    try {
      // Step 1: Create payment order on backend
      const orderRes = await fetch("/api/bookings/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      const orderData = await orderRes.json();

      // Step 2: Open Razorpay checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY, // your public Razorpay key
        amount: orderData.amount * 100, // amount in paise
        currency: "INR",
        name: "My Booking App",
        description: "Booking Payment",
        order_id: orderData.orderId,
        handler: async function (response) {
          // Step 3: Verify payment on backend
          const verifyRes = await fetch("/api/bookings/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: orderData.bookingId,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              userEmail: bookingData.userEmail,
            }),
          });
          const verifyData = await verifyRes.json();
          localStorage.removeItem("bookingData");
          navigate("/confirmation", { state: { booking: verifyData } });
        },
        theme: { color: "#4caf50" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      alert("Payment failed. Try again.");
    }
  };

  return (
    <div className="payment-page">
      <h2>Complete Payment</h2>
      <p>Total Amount: ₹{bookingData.amount}</p>
      <button onClick={handlePayment}>Pay Now</button>

      {/* Minimal CSS inside JSX */}
      <style>{`
        .payment-page {
          max-width: 400px;
          margin: 80px auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          text-align: center;
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
        }

        .payment-page h2 {
          margin-bottom: 20px;
          font-size: 1.5rem;
          color: #333;
        }

        .payment-page p {
          margin-bottom: 30px;
          font-size: 1.2rem;
          color: #555;
        }

        .payment-page button {
          padding: 10px 20px;
          font-size: 1rem;
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .payment-page button:hover {
          background-color: #45a049;
        }
      `}</style>
    </div>
  );
};

export default PaymentPage;