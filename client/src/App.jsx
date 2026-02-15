import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { Toaster } from "react-hot-toast";

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
import AdminLayout from "./pages/admin/Layout";
import ListShows from "./pages/admin/ListShows/ListShows";
import ListBookings from "./pages/admin/ListBookings/ListBookings";

/*  ORGANIZER */
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import AddEvent from "./pages/organizer/AddEvent";

const App = () => {
  const location = useLocation();

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

          {/* 🔐 AUTH ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 👑 ADMIN DASHBOARD */}
          <Route path="/admin/dashboard" element={<AdminLayout />}>
            <Route path="list-shows" element={<ListShows />} />
            <Route path="list-bookings" element={<ListBookings />} />
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
