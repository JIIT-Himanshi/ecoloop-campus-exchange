import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Clock3,
  CheckCircle2,
  Leaf,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Bell,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import DashboardCard from "../components/dashboard/DashboardCard";
import API from "../services/api";

function StudentDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    API.get("/users/dashboard")
      .then(({ data }) => {
        if (active) setDashboard(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load your dashboard."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = dashboard?.stats || {};
  const pendingRequests =
    (stats.sentRequests || 0) + (stats.receivedRequests || 0);
  const statCards = [
    {
      title: "Active Listings",
      value: loading ? "..." : stats.activeListings || 0,
      description: "Resources currently listed",
      icon: Package,
    },
    {
      title: "Pending Requests",
      value: loading ? "..." : pendingRequests,
      description: "Requests waiting for action",
      icon: Clock3,
    },
    {
      title: "Completed Exchanges",
      value: loading ? "..." : stats.completedTransactions || 0,
      description: "Successful campus exchanges",
      icon: CheckCircle2,
    },
    {
      title: "EcoPoints",
      value: loading ? "..." : stats.ecoPoints ?? user?.ecoPoints ?? 0,
      description: "Points earned through reuse",
      icon: Leaf,
    },
  ];

  const recentNotifications = dashboard?.recentNotifications || [];

  return (
    <div className="student-dashboard">
      <div className="dashboard-welcome">
        <div>
          <span className="dashboard-section-label">STUDENT OVERVIEW</span>
          <h1>Good to see you, {user?.name?.split(" ")[0] || "Student"}.</h1>
          <p>Here's what's happening with your campus resources.</p>
        </div>

        <Link to="/dashboard/create" className="dashboard-create-button">
          <Plus size={18} />
          Create Listing
        </Link>
      </div>

      {error && <p className="page-error" role="alert">{error}</p>}

      <div className="dashboard-stats-grid">
        {statCards.map((item) => (
          <DashboardCard
            key={item.title}
            title={item.title}
            value={item.value}
            description={item.description}
            icon={item.icon}
          />
        ))}
      </div>

      <div className="dashboard-lower-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="dashboard-section-label">YOUR ACTIVITY</span>
              <h2>Recent Activity</h2>
            </div>

            <Link to="/dashboard/notifications" className="dashboard-text-link">
              View all <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="dashboard-activity-list">
            {recentNotifications.length ? (
              recentNotifications.map((notification) => (
                <div className="dashboard-activity-item" key={notification._id}>
                  <div className="dashboard-activity-icon">
                    <Bell size={19} />
                  </div>

                  <div className="dashboard-activity-info">
                    <h3>{notification.title}</h3>
                    <p>{notification.message}</p>
                  </div>

                  <span className="dashboard-activity-time">
                    {notification.createdAt
                      ? new Date(notification.createdAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              ))
            ) : (
              <p className="dashboard-empty-activity">
                {loading ? "Loading recent activity..." : "No recent activity yet."}
              </p>
            )}
          </div>
        </section>

        <section className="dashboard-panel dashboard-quick-panel">
          <span className="dashboard-section-label">GET STARTED</span>
          <h2>Make the most of EcoLoop</h2>

          <p>
            Give unused resources a second life by sharing them with
            other students on campus.
          </p>

          <Link to="/dashboard/create" className="dashboard-quick-link">
            <span className="dashboard-quick-icon">
              <Plus size={19} />
            </span>
            <span>
              <strong>Post a resource</strong>
              <small>Create a new listing</small>
            </span>
            <ArrowRight size={18} />
          </Link>

          <Link to="/explore" className="dashboard-quick-link">
            <span className="dashboard-quick-icon">
              <Package size={19} />
            </span>
            <span>
              <strong>Explore resources</strong>
              <small>Discover campus listings</small>
            </span>
            <ArrowRight size={18} />
          </Link>
        </section>
      </div>
    </div>
  );
}

export default StudentDashboard;
