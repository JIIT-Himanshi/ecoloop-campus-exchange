import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, Trash2, Package } from "lucide-react";

import Loader from "../components/common/Loader";
import {
  getMyListings,
  deleteListing,
} from "../services/listingService";

function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyListings();
      setListings(data.listings || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load your listings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleDelete = async (listingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) return;

    try {
      await deleteListing(listingId);

      setListings((previous) =>
        previous.filter((item) => item._id !== listingId)
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete this listing."
      );
    }
  };

  if (loading) {
    return <Loader message="Loading your listings..." />;
  }

  return (
    <div className="my-listings-page">
      <div className="my-listings-heading">
        <div>
          <span className="dashboard-section-label">YOUR RESOURCES</span>
          <h1>My Listings</h1>
          <p>Manage the resources you have shared on EcoLoop.</p>
        </div>

        <Link to="/dashboard/create" className="dashboard-create-button">
          <Plus size={17} />
          Create Listing
        </Link>
      </div>

      {error && <div className="form-error">{error}</div>}

      {listings.length === 0 ? (
        <div className="listings-empty-state">
          <Package size={38} />
          <h2>No listings yet</h2>
          <p>
            You haven't shared any resources. Create your first listing
            to get started.
          </p>
          <Link to="/dashboard/create" className="dashboard-create-button">
            <Plus size={17} />
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="my-listings-grid">
          {listings.map((listing) => (
            <article className="my-listing-card" key={listing._id}>
              <div className="my-listing-image">
                {listing.imageUrl ? (
                  <img src={listing.imageUrl} alt={listing.title} />
                ) : (
                  <Package size={30} />
                )}
              </div>

              <div className="my-listing-content">
                <div className="my-listing-top">
                  <span className="listing-details-type">
                    {listing.type}
                  </span>
                  <span className="my-listing-status">
                    {listing.status || "Active"}
                  </span>
                </div>

                <h2>{listing.title}</h2>
                <p>{listing.category}</p>

                {listing.type === "For Sale" && (
                  <strong>₹{listing.price}</strong>
                )}

                <div className="my-listing-actions">
                  <Link to={`/listings/${listing._id}`}>
                    <Eye size={15} />
                    View
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(listing._id)}
                    aria-label={`Delete ${listing.title}`}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyListings;
