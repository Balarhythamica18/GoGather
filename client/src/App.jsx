import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { Toaster } from "react-hot-toast";
import ContactForm from "./components/ContactForm.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import ConfirmationPage from "./pages/ConfirmationPage.jsx";
import Chatbot from "./components/AIChatbot/Chatbot";

import "./App.css";

/*  PUBLIC PAGES */
import Home from "./pages/Home";
import Events from "./pages/Events";
import Eventdetails from "./pages/Eventdetails";
import FavoritePage from "./pages/FavoritePage";
import MyBookings from "./pages/MyBookings";
import SeatLayoutPage from "./pages/SeatLayoutPage";

/*  AUTH */
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register";
import VerifyOTP from "./pages/auth/VerifyOTP";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

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

import socket from "./socket";

import SquadChat from "./components/Squads/SquadChat";

import FloatingSquadChat from "./components/Squads/FloatingSquadChat";

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

  // Routes where Chat icons should be hidden
  const noChatRoutes = [
    "/login",
    "/register",
    "/verify-otp",
    "/forgot-password",
    "/reset-password"
  ];

  const hideLayoutRoutes = noLayoutRoutes.some(path =>
    location.pathname.toLowerCase().startsWith(path)
  );

  const hideChatIcons = noChatRoutes.some(path =>
    location.pathname.toLowerCase().startsWith(path)
  );

  const hideSquadChat = hideChatIcons || hideLayoutRoutes || location.pathname.toLowerCase().startsWith("/my-events");

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
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
            <Route path="/favorites" element={<FavoritePage />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/seats/:category/:id" element={<SeatLayoutPage />} />
            <Route path="/contact" element={<ContactForm />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />

            {/* 🔐 AUTH ROUTES */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

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
            <Route path="/my-events" element={<OrganizerDashboard />} />
            <Route path="/add-event" element={<AddEvent />} />
            <Route path="/add-event/:id" element={<AddEvent />} />

            <Route path="/squad-chat" element={<div className="p-10 text-center text-white">Squad Chat is now floating! Look for the icon at the bottom right.</div>} />
          </Routes>
        </main>

        {!hideSquadChat && <FloatingSquadChat />}
        {!hideChatIcons && <Chatbot />}

        {!hideLayoutRoutes && <Footer />}
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;
