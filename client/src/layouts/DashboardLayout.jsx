import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ClipboardList,
  Heart,
  ArrowLeftRight,
  Bell,
  UserRound,
  Flag,
  Leaf,
  LogOut,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function DashboardLayout({ role = "student" }) {
  const { user, logout } = useAuth();

  const studentLinks = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard, end: true },
    { name: "My Listings", path: "/dashboard/listings", icon: Package },
    { name: "Create Listing", path: "/dashboard/create", icon: PlusCircle },
    { name: "My Requests", path: "/dashboard/requests", icon: ClipboardList },
    { name: "Wishlist", path: "/dashboard/wishlist", icon: Heart },
    { name: "Transactions", path: "/dashboard/transactions", icon: ArrowLeftRight },
    { name: "Notifications", path: "/dashboard/notifications", icon: Bell },
    { name: "Submit a Report", path: "/dashboard/report", icon: Flag },
    { name: "My Profile", path: "/dashboard/profile", icon: UserRound },
  ];

  const adminLinks = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard, end: true },
    { name: "Manage Listings", path: "/admin/listings", icon: Package },
    { name: "Manage Users", path: "/admin/users", icon: UserRound },
    { name: "Reports", path: "/admin/reports", icon: ClipboardList },
  ];

  const links = role === "admin" ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <a href="/" className="dashboard-brand">
          <span className="dashboard-brand-icon">
            <Leaf size={21} />
          </span>
          EcoLoop<span>.</span>
        </a>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div>
            <strong>{user?.name || "Student"}</strong>
            <span>{role === "admin" ? "Administrator" : "Student"}</span>
          </div>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-navigation">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button onClick={handleLogout} className="sidebar-logout">
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-topbar-label">
              ECOLOOP / {role.toUpperCase()}
            </span>
            <h2>Welcome, {user?.name?.split(" ")[0] || "Student"}</h2>
          </div>

          <div className="dashboard-topbar-avatar">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </header>

        <section className="dashboard-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default DashboardLayout;
