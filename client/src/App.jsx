import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { Toaster } from "react-hot-toast";
import ContactForm from "./components/ContactForm.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import ConfirmationPage from "./pages/ConfirmationPage.jsx";

import "./App.css";

/*  PUBLIC PAGES */
import Home from "./pages/Home";
import Events from "./pages/Events";
import Eventdetails from "./pages/Eventdetails";
import Favorites from "./pages/Favorites";
import MyBookings from "./pages/MyBookings";
import SeatLayoutPage from "./pages/SeatLayoutPage";

/*  AUTH */
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register";

/*  ADMIN */
import AdminProtectedRoute from "./components/common/AdminProtectedRoute";
import AdminLayout from "./pages/admin/Layout";
import AdminDashboard from "./pages/admin/AdminDashboard"; // to be created
import ListShows from "./pages/admin/ListShows/ListShows";
import ListBookings from "./pages/admin/ListBookings/ListBookings";
import UserManagement from "./pages/admin/UserManagement";
import EventApprovals from "./pages/admin/EventApprovals";

/*  ORGANIZER */
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import AddEvent from "./pages/organizer/AddEvent";

import io from "socket.io-client";
const socket = io("http://localhost:5000");

const App = () => {
  const location = useLocation();

  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user && user._id) {
      socket.emit("identify", user._id);
    }
  }, []);

  // Routes where Navbar & Footer should be hidden
  const noLayoutRoutes = [
    "/admin",        // all admin routes
    "/dashboard",    // organizer dashboard
    "/add-event"     // organizer add event
  ];

  const hideLayoutRoutes = noLayoutRoutes.some(path =>
    location.pathname.toLowerCase().startsWith(path)
  );

  return (
    <div className="app-layout">
      <Toaster position="top-right" />
      <ScrollToTop />

      {!hideLayoutRoutes && <Navbar />}

      <main className="main-content">
        <Routes>

          {/* 🌍 PUBLIC ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:category/:id" element={<Eventdetails />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/seats/:category/:id" element={<SeatLayoutPage />} />
          <Route path="/contact" element={<ContactForm />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />

          {/* 🔐 AUTH ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 👑 ADMIN AREA */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="list-shows" element={<ListShows />} />
              <Route path="list-bookings" element={<ListBookings />} />
              <Route path="event-approvals" element={<EventApprovals />} />
            </Route>
          </Route>

          {/* 🎤 ORGANIZER DASHBOARD */}
          <Route path="/dashboard" element={<OrganizerDashboard />} />
          <Route path="/add-event" element={<AddEvent />} />
          <Route path="/add-event/:id" element={<AddEvent />} />

        </Routes>
      </main>

      {!hideLayoutRoutes && <Footer />}
    </div>
  );
};

export default App;
