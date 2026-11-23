import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Leaf } from "lucide-react";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import ListingFilters from "../components/listings/ListingFilters";
import ListingGrid from "../components/listings/ListingGrid";
import { getListings } from "../services/listingService";

import "../App.css";

const categories = ["Books & Notes", "Electronics", "Stationery", "Other"];

function Explore() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCategory = searchParams.get("category");
  const category = categories.includes(requestedCategory) ? requestedCategory : "All";
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("newest");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const setCategory = (value) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === "All") {
          next.delete("category");
        } else {
          next.set("category", value);
        }
        return next;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const timer = setTimeout(async () => {
      try {
        const response = await getListings({ search, category, type, sort });
        if (active) setListings(response.listings || []);
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load listings. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }, search ? 250 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, category, type, sort]);

  const handleStartSharing = () => {
    navigate(user ? "/dashboard/create" : "/login");
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setType("All");
    setSort("newest");
  };

  return (
    <div className="home-page">
      <Navbar />

      <main className="explore-page">
        <section className="explore-header">
          <div className="explore-heading">
            <span className="eyebrow">
              <Leaf size={15} />
              CAMPUS MARKETPLACE
            </span>

            <h1>
              Find something
              <span> worth reusing.</span>
            </h1>

            <p>
              Discover pre-loved resources shared by students.
              Buy, exchange or donate and make campus life more sustainable.
            </p>
          </div>

          <div className="explore-count" aria-live="polite">
            <strong>{loading ? "-" : listings.length}</strong>
            <span>resources available</span>
          </div>
        </section>

        <section className="explore-content">
          <div className="explore-section-heading">
            <div>
              <span className="eyebrow">DISCOVER RESOURCES</span>
              <h2>Explore listings</h2>
            </div>
          </div>

          <ListingFilters
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            type={type}
            setType={setType}
            sort={sort}
            setSort={setSort}
          />

          <div className="explore-results">
            <p aria-live="polite">
              Showing <strong>{loading ? "..." : listings.length}</strong> resources
            </p>

            {(search || category !== "All" || type !== "All" || sort !== "newest") && (
              <button className="clear-filters" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          {error ? (
            <p className="page-error" role="alert">{error}</p>
          ) : loading ? (
            <p className="explore-loading" role="status">Loading listings…</p>
          ) : (
            <ListingGrid listings={listings} />
          )}
        </section>

        <section className="explore-cta">
          <div>
            <span className="eyebrow">BE PART OF THE CHANGE</span>
            <h2>Have something to share?</h2>
            <p>
              Give your unused resources a second life.
              Someone on campus might need them.
            </p>
          </div>

          <button className="explore-cta-button" onClick={handleStartSharing}>
            Start sharing
            <ArrowUpRight size={17} />
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Explore;
