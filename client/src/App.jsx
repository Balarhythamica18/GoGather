import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Eventdetails from "./pages/Eventdetails";
import Favorites from "./pages/Favorites";
import MyBookings from "./pages/MyBookings";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "./components/ScrollToTop";
import SeatLayoutPage from "./pages/SeatLayoutPage";

// Admin
import Layout from "./pages/admin/Layout";
import Dashboard from "./pages/admin/Dashboard/Dashboard";
import AddShow from "./pages/admin/AddShow/AddShow";
import ListShows from "./pages/admin/ListShows/ListShows";
import ListBookings from "./pages/admin/ListBookings/ListBookings";
import "./App.css";

const App = () => {
  const location = useLocation();

  // ✅ CASE-INSENSITIVE admin detection
  const isAdminRoute = location.pathname
    .toLowerCase()
    .startsWith("/admin");

  return (
    <div className="app-layout">
      <Toaster position="top-right" />
      <ScrollToTop />

      {/* Hide Navbar for admin */}
      {!isAdminRoute && <Navbar />}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:category/:id" element={<Eventdetails />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/seats/:category/:id" element={<SeatLayoutPage />} />

          {/* ✅ ADMIN ROUTES */}
          <Route path="/admin/*" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="add-shows" element={<AddShow />} />
            <Route path="list-shows" element={<ListShows />} />
            <Route path="list-bookings" element={<ListBookings />} />
          </Route>
        </Routes>
      </main>

      {/* Hide Footer for admin */}
      {!isAdminRoute && <Footer />}
    </div>
  );
};

export default App;