import { useEffect, useState } from "react";
import { Check, X, Trash2, Search, PackageOpen } from "lucide-react";
import API from "../services/api";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";

function ManageListings() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/admin/listings");
      setListings(response.data.listings || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load listings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleStatusChange = async (listingId, status) => {
    try {
      setActionLoading(listingId);
      setError("");

      await API.patch(`/admin/listings/${listingId}/status`, {
        status,
      });

      await fetchListings();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update listing."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async (listingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this listing?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(listingId);
      setError("");

      await API.delete(`/admin/listings/${listingId}`);

      setListings((previous) =>
        previous.filter((listing) => listing._id !== listingId)
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to remove listing."
      );
    } finally {
      setActionLoading("");
    }
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title?.toLowerCase().includes(search.toLowerCase()) ||
      listing.owner?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || listing.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">CONTENT MODERATION</span>
          <h1>Manage Listings</h1>
          <p>Review and manage resources posted by students.</p>
        </div>
      </div>

      <div className="manage-listing-toolbar">
        <div className="manage-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by listing or student..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter listings by status"
        >
          <option value="All">All Listings</option>
          <option value="Pending">Pending</option>
          <option value="Active">Active</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {error && <div className="page-error">{error}</div>}

      {loading ? (
        <Loader message="Loading listings..." />
      ) : filteredListings.length === 0 ? (
        <div className="page-empty">
          <PackageOpen size={32} />
          <h3>No listings found</h3>
          <p>There are no listings matching this filter.</p>
        </div>
      ) : (
        <div className="admin-listing-list">
          {filteredListings.map((listing) => (
            <article className="admin-listing-card" key={listing._id}>
              <div className="admin-listing-image">
                {listing.imageUrl ? (
                  <img src={listing.imageUrl} alt={listing.title} />
                ) : (
                  <PackageOpen size={25} />
                )}
              </div>

              <div className="admin-listing-info">
                <div className="admin-listing-title-row">
                  <h3>{listing.title}</h3>

                  <span
                    className={`status-badge ${
                      listing.status?.toLowerCase() || "pending"
                    }`}
                  >
                    {listing.status || "Pending"}
                  </span>
                </div>

                <p>{listing.category} · {listing.type}</p>
                <p>Posted by: {listing.owner?.name || "Student"}</p>

                {listing.type === "For Sale" && (
                  <strong>₹{listing.price}</strong>
                )}
              </div>

              <div className="admin-listing-actions">
                {listing.status === "Pending" && (
                  <>
                    <Button
                      onClick={() =>
                        handleStatusChange(listing._id, "Active")
                      }
                      disabled={actionLoading === listing._id}
                    >
                      <Check size={16} />
                      Approve
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() =>
                        handleStatusChange(listing._id, "Rejected")
                      }
                      disabled={actionLoading === listing._id}
                    >
                      <X size={16} />
                      Reject
                    </Button>
                  </>
                )}

                <button
                  className="admin-delete-button"
                  onClick={() => handleDelete(listing._id)}
                  disabled={actionLoading === listing._id}
                  aria-label={`Delete ${listing.title}`}
                >
                  <Trash2 size={17} />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ManageListings;
