import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Flag } from "lucide-react";

import { submitReport } from "../services/reportService";

function SubmitReport() {
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get("listingId") || "";
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);
      await submitReport({
        subject: subject.trim(),
        description: description.trim(),
        ...(listingId ? { listingId } : {}),
      });
      setSubject("");
      setDescription("");
      setSuccess("Your report has been submitted for review.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to submit your report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="listing-page">
      <Link to="/dashboard" className="listing-back-link">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="listing-page-heading">
        <span className="dashboard-section-label">STUDENT SUPPORT</span>
        <h1>Submit a Report</h1>
        <p>Tell the EcoLoop team about an issue that needs review.</p>
      </div>

      <div className="listing-form-panel report-form-panel">
        <div className="listing-form-title">
          <Flag size={20} />
          <h2>Report details</h2>
        </div>

        {listingId && (
          <p className="report-context">
            This report will be attached to the listing you selected.
          </p>
        )}
        {error && <p className="page-error" role="alert">{error}</p>}
        {success && <p className="page-success" role="status">{success}</p>}

        <form className="report-form" onSubmit={handleSubmit}>
          <div className="profile-field">
            <label htmlFor="report-subject">Subject</label>
            <input
              id="report-subject"
              name="subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={120}
              required
            />
          </div>

          <div className="profile-field">
            <label htmlFor="report-description">Description</label>
            <textarea
              id="report-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1500}
              rows={6}
              required
            />
          </div>

          <button
            type="submit"
            className="listing-request-button"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit report"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SubmitReport;
