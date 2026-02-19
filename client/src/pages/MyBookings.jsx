import React, { useEffect, useState } from "react";
import axios from "axios";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const token = localStorage.getItem("token");

    const res = await axios.get("/api/my-bookings", {
      headers: { Authorization: `Bearer ${token}` }
    });

    setBookings(res.data);
  };

  return (
    <div className="wrapper">
      <h2 className="heading">My Bookings</h2>

      {bookings.map((item) => (
        <div key={item._id} className="booking-card">

          <img
            src={item.event.image}
            alt={item.event.title}
            className="booking-image"
          />

          <div className="details">
            <h3 className="title">{item.event.title}</h3>
            <p className="description">{item.event.description}</p>
            <p className="date">{item.event.date}</p>
          </div>

          <div className="right-side">
            <h3 className="price">₹{item.event.price}</h3>
            <p className="info">Total Tickets: {item.tickets}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyBookings;
