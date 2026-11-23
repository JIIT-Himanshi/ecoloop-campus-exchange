
import { useEffect, useState } from "react";
import { Flag, CheckCircle, XCircle } from "lucide-react";
import API from "../services/api";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/admin/reports");
      setReports(response.data.reports || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleReportStatus = async (reportId, status) => {
    try {
      setUpdating(reportId);
      setError("");

      await API.patch(`/admin/reports/${reportId}/status`, {
        status,
      });

      await fetchReports();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update report."
      );
    } finally {
      setUpdating("");
    }
  };

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">SAFETY AND MODERATION</span>
          <h1>Reports</h1>
          <p>Review reports submitted by campus members.</p>
        </div>
      </div>

      {error && <div className="page-error">{error}</div>}

      {loading ? (
        <Loader message="Loading reports..." />
      ) : reports.length === 0 ? (
        <div className="page-empty">
          <Flag size={32} />
          <h3>No reports found</h3>
          <p>There are currently no reports to review.</p>
        </div>
      ) : (
        <div className="report-list">
          {reports.map((report) => (
            <article className="report-card" key={report._id}>
              <div className="report-icon">
                <Flag size={21} />
              </div>

              <div className="report-content">
                <h3>
                  {report.subject || "Reported content"}
                </h3>

                <p>{report.description}</p>

                <span>
                  Reported by: {report.reporter?.name || "Student"}
                </span>

                <span>
                  {report.createdAt
                    ? new Date(report.createdAt).toLocaleDateString()
                    : ""}
                </span>

                <div className="report-status">
                  <span
                    className={`status-badge ${
                      report.status?.toLowerCase() || "pending"
                    }`}
                  >
                    {report.status || "Pending"}
                  </span>
                </div>
              </div>

              {report.status === "Pending" && (
                <div className="report-actions">
                  <Button
                    onClick={() =>
                      handleReportStatus(report._id, "Resolved")
                    }
                    disabled={updating === report._id}
                  >
                    <CheckCircle size={16} />
                    Resolve
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      handleReportStatus(report._id, "Dismissed")
                    }
                    disabled={updating === report._id}
                  >
                    <XCircle size={16} />
                    Dismiss
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Reports;
