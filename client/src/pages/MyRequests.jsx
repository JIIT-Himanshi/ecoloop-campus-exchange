
import { useEffect, useState } from "react";
import { ArrowRightLeft, Check, X, Clock } from "lucide-react";
import {
  getSentRequests,
  getReceivedRequests,
  updateRequestStatus,
} from "../services/requestService";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";

function MyRequests() {
  const [activeTab, setActiveTab] = useState("received");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        activeTab === "received"
          ? await getReceivedRequests()
          : await getSentRequests();

      setRequests(data.requests || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const handleStatusChange = async (requestId, status) => {
    try {
      setActionLoading(requestId);
      setError("");

      await updateRequestStatus(requestId, status);
      await fetchRequests();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update request."
      );
    } finally {
      setActionLoading("");
    }
  };

  const getStatusClass = (status) => {
    return status?.toLowerCase() || "pending";
  };

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">YOUR ACTIVITY</span>
          <h1>My Requests</h1>
          <p>Keep track of the resource requests you send and receive.</p>
        </div>
      </div>

      <div className="request-tabs">
        <button
          className={activeTab === "received" ? "active" : ""}
          onClick={() => setActiveTab("received")}
        >
          Received Requests
        </button>

        <button
          className={activeTab === "sent" ? "active" : ""}
          onClick={() => setActiveTab("sent")}
        >
          Sent Requests
        </button>
      </div>

      {error && <div className="page-error">{error}</div>}

      {loading ? (
        <Loader message="Loading requests..." />
      ) : requests.length === 0 ? (
        <div className="page-empty">
          <ArrowRightLeft size={32} />
          <h3>No requests found</h3>
          <p>
            {activeTab === "received"
              ? "You have not received any requests yet."
              : "You have not sent any requests yet."}
          </p>
        </div>
      ) : (
        <div className="request-list">
          {requests.map((request) => (
            <article className="request-card" key={request._id}>
              <div className="request-card-main">
                <div className="request-icon">
                  <ArrowRightLeft size={21} />
                </div>

                <div>
                  <h3>
                    {request.listing?.title || "Resource request"}
                  </h3>

                  <p>
                    {activeTab === "received"
                      ? `Requested by: ${request.requester?.name || "Student"}`
                      : `Request sent to: ${request.owner?.name || "Student"}`}
                  </p>

                  <span className="request-date">
                    {request.createdAt
                      ? new Date(request.createdAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              </div>

              <div className="request-card-actions">
                <span
                  className={`status-badge ${getStatusClass(request.status)}`}
                >
                  {request.status || "Pending"}
                </span>

                {activeTab === "received" &&
                  request.status === "Pending" && (
                    <div className="request-buttons">
                      <Button
                        onClick={() =>
                          handleStatusChange(request._id, "Accepted")
                        }
                        disabled={actionLoading === request._id}
                      >
                        <Check size={16} /> Accept
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() =>
                          handleStatusChange(request._id, "Rejected")
                        }
                        disabled={actionLoading === request._id}
                      >
                        <X size={16} /> Reject
                      </Button>
                    </div>
                  )}

                {activeTab === "sent" &&
                  request.status === "Pending" && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        handleStatusChange(request._id, "Cancelled")
                      }
                      disabled={actionLoading === request._id}
                    >
                      Cancel Request
                    </Button>
                  )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyRequests;
