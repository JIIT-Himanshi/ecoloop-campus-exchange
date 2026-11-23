import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Flag, MapPin, Tag, UserRound } from "lucide-react";

import Loader from "../components/common/Loader";
import { useAuth } from "../context/AuthContext";
import { getListingById } from "../services/listingService";
import { sendRequest } from "../services/requestService";

function ListingDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getListingById(id);
        setListing(data.listing || data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load this listing."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleSendRequest = async () => {
    try {
      setRequestLoading(true);
      setRequestFeedback(null);
      await sendRequest(listing._id);
      setRequestFeedback({
        type: "success",
        message: "Your request was sent to the listing owner.",
      });
    } catch (requestError) {
      setRequestFeedback({
        type: "error",
        message:
          requestError.response?.data?.message ||
          "Unable to send your request. Please try again.",
      });
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading listing..." />;
  }

  if (error || !listing) {
    return (
      <div className="listing-message">
        <h2>Listing unavailable</h2>
        <p>{error || "This listing could not be found."}</p>
        <Link to="/explore">Back to Explore</Link>
      </div>
    );
  }

  const ownerId = listing.owner?._id || listing.owner;
  const isOwner = user && String(ownerId) === String(user.id || user._id);
  const reportPath = user?.role === "student"
    ? `/dashboard/report?listingId=${listing._id}`
    : "/login";

  return (
    <div className="listing-details-page">
      <Link to="/explore" className="listing-back-link">
        <ArrowLeft size={16} />
        Back to Explore
      </Link>

      <div className="listing-details-card">
        <div className="listing-details-image">
          {listing.imageUrl ? (
            <img src={listing.imageUrl} alt={listing.title} />
          ) : (
            <div className="listing-image-placeholder">
              Resource image not available
            </div>
          )}
        </div>

        <div className="listing-details-content">
          <span className="listing-details-type">{listing.type}</span>

          <h1>{listing.title}</h1>

          <p className="listing-details-description">
            {listing.description}
          </p>

          {listing.type === "For Sale" && (
            <h2 className="listing-details-price">
              ₹{listing.price}
            </h2>
          )}

          {listing.type === "Exchange" && listing.exchangeFor && (
            <p className="listing-exchange-info">
              Looking for: {listing.exchangeFor}
            </p>
          )}

          <div className="listing-details-meta">
            <span><Tag size={16} /> {listing.category}</span>
            <span><MapPin size={16} /> {listing.location}</span>
            <span><UserRound size={16} /> {listing.owner?.name || "Student"}</span>
          </div>

          <p className="listing-condition">
            Condition: <strong>{listing.condition}</strong>
          </p>

          <p className="listing-details-note">
            Connect with the listing owner to coordinate the exchange
            on campus.
          </p>

          <div className="listing-details-actions">
            {listing.status === "Active" && !isOwner && user?.role === "student" && (
              <button
                type="button"
                className="listing-request-button"
                onClick={handleSendRequest}
                disabled={requestLoading || requestFeedback?.type === "success"}
              >
                {requestLoading
                  ? "Sending request..."
                  : requestFeedback?.type === "success"
                  ? "Request sent"
                  : "Send request"}
              </button>
            )}

            {listing.status === "Active" && !isOwner && !user && (
              <Link to="/login" className="listing-request-button">
                Log in to request
              </Link>
            )}

            {user?.role !== "admin" && (
              <Link to={reportPath} className="listing-report-link">
                <Flag size={15} />
                {user ? "Report this listing" : "Log in to report"}
              </Link>
            )}
          </div>

          {requestFeedback && (
            <p
              className={requestFeedback.type === "error" ? "page-error" : "page-success"}
              role={requestFeedback.type === "error" ? "alert" : "status"}
            >
              {requestFeedback.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListingDetails;
