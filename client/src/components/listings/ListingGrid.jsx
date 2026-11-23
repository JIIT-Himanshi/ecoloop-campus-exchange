import ListingCard from "./ListingCard";

function ListingGrid({ listings = [], onWishlist }) {
  if (listings.length === 0) {
    return (
      <div className="empty-listings">
        <h3>No resources found</h3>
        <p>Try changing your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="featured-grid">
      {listings.map((listing) => (
        <ListingCard
          key={listing._id || listing.id}
          listing={listing}
          onWishlist={onWishlist}
        />
      ))}
    </div>
  );
}

export default ListingGrid;
