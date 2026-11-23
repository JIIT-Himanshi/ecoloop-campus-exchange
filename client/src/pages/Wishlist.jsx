
import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getWishlist, removeFromWishlist } from "../services/wishlistService";
import Loader from "../components/common/Loader";

function Wishlist() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getWishlist();
      setListings(data.wishlist || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load wishlist."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (listingId) => {
    try {
      setError("");
      await removeFromWishlist(listingId);

      setListings((previous) =>
        previous.filter((item) => item.listing?._id !== listingId)
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to remove item."
      );
    }
  };

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">SAVED RESOURCES</span>
          <h1>My Wishlist</h1>
          <p>Resources you have saved for later.</p>
        </div>
      </div>

      {error && <div className="page-error">{error}</div>}

      {loading ? (
        <Loader message="Loading wishlist..." />
      ) : listings.length === 0 ? (
        <div className="page-empty">
          <Heart size={32} />
          <h3>Your wishlist is empty</h3>
          <p>Save interesting resources to find them here later.</p>
          <Link to="/explore" className="text-link">
            Explore resources
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {listings.map((item) => {
            const listing = item.listing;

            if (!listing) return null;

            return (
              <article className="wishlist-card" key={listing._id}>
                <div className="wishlist-image">
                  {listing.imageUrl ? (
                    <img src={listing.imageUrl} alt={listing.title} />
                  ) : (
                    <div className="wishlist-image-placeholder">
                      <Heart size={26} />
                    </div>
                  )}
                </div>

                <div className="wishlist-content">
                  <span className="listing-type">
                    {listing.type}
                  </span>

                  <h3>{listing.title}</h3>
                  <p>{listing.category}</p>

                  {listing.type === "For Sale" && (
                    <strong>₹{listing.price}</strong>
                  )}

                  <div className="wishlist-actions">
                    <Link to={`/listings/${listing._id}`}>
                      View Details
                    </Link>

                    <button
                      onClick={() => handleRemove(listing._id)}
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Wishlist;
