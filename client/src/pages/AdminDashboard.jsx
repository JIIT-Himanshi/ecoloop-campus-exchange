import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  Clock3,
  ArrowLeftRight,
  Leaf,
} from "lucide-react";
import { Link } from "react-router-dom";
import API from "../services/api";
import Loader from "../components/common/Loader";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const response = await API.get("/admin/dashboard");
        setStats(response.data.stats);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load dashboard statistics."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Total Students",
      value: stats?.totalUsers,
      icon: Users,
    },
    {
      label: "Total Listings",
      value: stats?.totalListings,
      icon: BookOpen,
    },
    {
      label: "Pending Listings",
      value: stats?.pendingListings,
      icon: Clock3,
    },
    {
      label: "Total Requests",
      value: stats?.totalRequests,
      icon: ArrowLeftRight,
    },
    {
      label: "Completed Transactions",
      value: stats?.completedTransactions,
      icon: Leaf,
    },
  ];

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">PLATFORM OVERVIEW</span>
          <h1>Admin Dashboard</h1>
          <p>Monitor EcoLoop activity and manage the platform.</p>
        </div>
      </div>

      {error && <div className="page-error">{error}</div>}

      {loading ? (
        <Loader message="Loading dashboard..." />
      ) : stats ? (
        <>
          <div className="admin-stats-grid">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <article className="admin-stat-card" key={card.label}>
                  <div className="admin-stat-icon">
                    <Icon size={22} />
                  </div>

                  <p>{card.label}</p>
                  <h2>{card.value ?? 0}</h2>
                </article>
              );
            })}
          </div>

          <div className="admin-welcome-panel">
            <div>
              <span className="page-eyebrow">ADMIN CONTROL</span>
              <h2>Manage your campus community</h2>
              <p>
                Review resource listings and keep the EcoLoop
                marketplace organised.
              </p>
            </div>

            <Link to="/admin/listings">
              Review Listings
            </Link>
          </div>
        </>
      ) : (
        <div className="page-empty">
          <h3>Dashboard data unavailable</h3>
          <p>Statistics could not be loaded.</p>
        </div>
      )}
    </section>
  );
}

export default AdminDashboard;
