
function DashboardCard({ title, value, description, icon: Icon }) {
  return (
    <div className="dashboard-stat-card">
      <div className="dashboard-stat-top">
        <span className="dashboard-stat-title">{title}</span>

        <span className="dashboard-stat-icon">
          <Icon size={20} strokeWidth={1.8} />
        </span>
      </div>

      <h2>{value}</h2>
      <p>{description}</p>
    </div>
  );
}

export default DashboardCard;
