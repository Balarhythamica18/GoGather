import React from "react";
import { dummybookingdata } from "../data/assets";

const MyBookings = () => {
  return (
    <div className="wrapper">
      <h2 className="heading">My Bookings</h2>

      {dummybookingdata.map((item) => (
        <div key={item.id} className="booking-card">
          {/* Image */}
          <img src={item.image} alt={item.title} className="booking-image" />

          {/* Details */}
          <div className="details">
            <h3 className="title">{item.title}</h3>
            <p className="description">{item.description}</p>
            <p className="date">
              {item.month} {item.date}
            </p>
          </div>

          {/* Right Side */}
          <div className="right-side">
            <h3 className="price">₹{item.price}</h3>
            <p className="info">Total Tickets: {item.tickets}</p>
            <p className="info">Seat Number: {item.seats}</p>
          </div>
        </div>
      ))}

      {/* CSS */}
      <style>{`
        .wrapper {
          min-height: 100vh;
          background-color: #ffffff;
          padding: 120px;
          color: #111;
          font-family: Arial, sans-serif;
        }
        .heading {
          font-size: 28px;
          margin-bottom: 40px;
          font-weight: 600;
          color: #222;
        }
        .booking-card {
          display: flex;
          align-items: center;
          background-color: #ffffff;
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 24px;
          border: 1px solid #e5e5e5;
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
          gap: 24px;
          flex-wrap: wrap;
        }
        .booking-image {
          width: 140px;
          height: 170px;
          border-radius: 12px;
          object-fit: cover;
        }
        .details {
          flex: 1;
        }
        .title {
          font-size: 20px;
          margin-bottom: 8px;
          font-weight: 600;
          color: #111;
        }
        .description {
          font-size: 14px;
          color: #555;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .date {
          font-size: 14px;
          color: #d32f2f;
          font-weight: 500;
        }
        .right-side {
          text-align: right;
          min-width: 180px;
        }
        .price {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #111;
        }
        .info {
          font-size: 14px;
          color: #444;
          margin-bottom: 6px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .booking-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .booking-image {
            margin-bottom: 16px;
            width: 100%;
            height: auto;
          }
          .right-side {
            text-align: left;
            width: 100%;
            margin-top: 12px;
          }
        }

        @media (max-width: 768px) {
          .wrapper {
            padding: 60px 30px;
          }
          .heading {
            font-size: 24px;
            margin-bottom: 32px;
          }
          .booking-card {
            padding: 16px;
            gap: 16px;
          }
          .title {
            font-size: 18px;
          }
          .description, .info, .date {
            font-size: 13px;
          }
          .price {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .wrapper {
            padding: 40px 20px;
          }
          .heading {
            font-size: 20px;
            margin-bottom: 24px;
          }
          .title {
            font-size: 16px;
          }
          .description, .info, .date {
            font-size: 12px;
          }
          .price {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
};

export default MyBookings;
