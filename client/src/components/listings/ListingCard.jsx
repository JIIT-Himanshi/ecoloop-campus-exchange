import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ArrowUpRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { addToWishlist } from "../../services/wishlistService";

function ListingCard({ listing }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistFeedback, setWishlistFeedback] = useState(null);

  const { title, category, price, condition, type } = listing;
  const typeClass =
    type === "For Sale" ? "sale-type" : type === "Exchange" ? "exchange-type" : "donation-type";
  const listingId = listing._id;
  const ownerName = listing.owner?.name || "Student";
  const initials = ownerName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const ownerId = listing.owner?._id || listing.owner;
  const isOwner = user && String(ownerId) === String(user.id || user._id);
  const listingPrice =
    type === "Donation" ? "Free" : type === "Exchange" ? "Exchange" : `₹${price}`;

  const handleWishlist = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setWishlistLoading(true);
      setWishlistFeedback(null);
      await addToWishlist(listingId);
      setWishlistFeedback({
        type: "success",
        message: "Added to your wishlist.",
      });
    } catch (err) {
      setWishlistFeedback({
        type: "error",
        message:
          err.response?.data?.message ||
          "Unable to add this item to your wishlist. Please try again.",
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <article className="listing-card">
      <div className="listing-image-wrapper">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={title} />
        ) : (
          <div className="listing-image-placeholder">Image unavailable</div>
        )}

        <span className={`listing-type ${typeClass}`}>
          {type}
        </span>

        <button
          className="wishlist-button"
          aria-label={`Save ${title} to wishlist`}
          onClick={handleWishlist}
          disabled={wishlistLoading || isOwner}
          title={isOwner ? "Your listing" : "Add to wishlist"}
        >
          <Heart size={18} strokeWidth={1.8} />
        </button>
      </div>

      <div className="listing-info">
        <p className="listing-category">{category}</p>

        <h3>{title}</h3>

        <div className="listing-condition">
          <span></span>
          {condition}
        </div>

        <div className="listing-divider"></div>

        <div className="listing-bottom">
          <div className="listing-owner">
            <span className="owner-avatar">{initials}</span>
            <span>{ownerName}</span>
          </div>

          <strong className="listing-price">{listingPrice}</strong>
        </div>

        {wishlistFeedback && (
          <div
            className={
              wishlistFeedback.type === "error" ? "page-error" : "page-success"
            }
            role={wishlistFeedback.type === "error" ? "alert" : "status"}
          >
            {wishlistFeedback.message}
          </div>
        )}

        <Link to={`/listings/${listingId}`} className="listing-view-link">
          View details
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}

export default ListingCard;
