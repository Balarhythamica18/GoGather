import { useEffect, useState } from "react";
import Loading from "../../../components/loading";
import { dummyEventDashboardData } from "../../../data/assets";
import {
  CalendarIcon,
  CurrencyRupeeIcon,
  UsersIcon,
  TicketIcon
} from "@heroicons/react/24/outline";
import "./Dashboard.css";
import Title from "../../../components/Admin/Title";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeEvents: [],
    totalUsers: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setDashboardData({
        totalBookings: dummyEventDashboardData.totalBookings,
        totalRevenue: dummyEventDashboardData.totalRevenue,
        activeEvents: dummyEventDashboardData.activeEvents,
        totalUsers: dummyEventDashboardData.totalUsers
      });

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="dashboard_container_unique">
      <Title text1="Admin" text2="Dashboard" />

      <div className="dashboard_grid_unique">
        <div className="dashboard_card_bookings">
          <h4>
            <TicketIcon />
            Total Bookings
          </h4>
          <p>{dashboardData.totalBookings}</p>
        </div>

        <div className="dashboard_card_revenue">
          <h4>
            <CurrencyRupeeIcon />
            Total Revenue
          </h4>
          <p>₹ {dashboardData.totalRevenue}</p>
        </div>

        <div className="dashboard_card_activeEvents">
          <h4>
            <CalendarIcon />
            Active Events
          </h4>
          <p>{dashboardData.activeEvents.length}</p>
        </div>

        <div className="dashboard_card_totalUsers">
          <h4>
            <UsersIcon />
            Total Users
          </h4>
          <p>{dashboardData.totalUsers}</p>
        </div>
      </div>

      <p className="dashboard-title">Active Events</p>

      <div className="adminevents-container">
        {dashboardData.activeEvents.map((event) => (
          <div className="adminevent-card" key={event.id}>
            <img
              src={event.image}
              alt={event.title}
              className="adminevent-image"
            />

            <p className="adminevent-title">{event.title}</p>

            <div className="adminevent-footer">
              <p className="adminevent-price">
                {event.price ? event.price : "Free"}
              </p>
              <p className="adminevent-location">{event.location}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
