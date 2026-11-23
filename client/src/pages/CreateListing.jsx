import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PlusCircle } from "lucide-react";

import ListingForm from "../components/listings/ListingForm";
import { createListing } from "../services/listingService";

function CreateListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateListing = async (listingData) => {
    try {
      setLoading(true);
      setError("");

      await createListing(listingData);

      navigate("/dashboard/listings");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to create listing. Please try again."
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
        <span className="dashboard-section-label">SHARE A RESOURCE</span>
        <h1>Create a Listing</h1>
        <p>
          Help another student by selling, exchanging or donating
          something you no longer need.
        </p>
      </div>

      <div className="listing-form-panel">
        <div className="listing-form-title">
          <PlusCircle size={21} />
          <h2>Resource Information</h2>
        </div>

        <ListingForm
          onSubmit={handleCreateListing}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}

export default CreateListing;
