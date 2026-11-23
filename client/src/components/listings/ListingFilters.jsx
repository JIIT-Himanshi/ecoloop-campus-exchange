
import { Search, SlidersHorizontal } from "lucide-react";

function ListingFilters({
  search,
  setSearch,
  category,
  setCategory,
  type,
  setType,
  sort,
  setSort,
}) {
  return (
    <div className="listing-filters">
      <div className="filter-search">
        <Search size={19} />
        <input
          type="text"
          placeholder="Search books, electronics, notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-options">
        <div className="filter-group">
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="All">All categories</option>
            <option value="Books & Notes">Books & Notes</option>
            <option value="Electronics">Electronics</option>
            <option value="Stationery">Stationery</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Listing type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="All">All types</option>
            <option value="For Sale">For Sale</option>
            <option value="Exchange">Exchange</option>
            <option value="Donation">Donation</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default ListingFilters;
