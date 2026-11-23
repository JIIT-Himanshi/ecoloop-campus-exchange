
import { useState } from "react";
import { ImagePlus } from "lucide-react";
import Button from "../common/Button";

function ListingForm({
  onSubmit,
  submitLabel = "Publish Listing",
  loading = false,
  error = "",
  initialValues = {},
}) {
  const [formData, setFormData] = useState({
    title: initialValues.title || "",
    description: initialValues.description || "",
    category: initialValues.category || "",
    type: initialValues.type || "For Sale",
    condition: initialValues.condition || "Good",
    price: initialValues.price || "",
    exchangeFor: initialValues.exchangeFor || "",
    location: initialValues.location || "",
  });

  const [image, setImage] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      ...formData,
      price: formData.type === "For Sale" ? Number(formData.price) : 0,
      image,
    });
  };

  return (
    <form className="listing-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="title">Listing Title *</label>
        <input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. First Year Engineering Mathematics Book"
          required
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the resource and its condition..."
          rows={5}
          required
          maxLength={1000}
        />
      </div>

      <div className="listing-form-row">
        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>
            <option value="Books & Notes">Books & Notes</option>
            <option value="Electronics">Electronics</option>
            <option value="Stationery">Stationery</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="type">Listing Type *</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="For Sale">For Sale</option>
            <option value="Exchange">Exchange</option>
            <option value="Donation">Donation</option>
          </select>
        </div>
      </div>

      <div className="listing-form-row">
        <div className="form-group">
          <label htmlFor="condition">Condition *</label>
          <select
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            required
          >
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>
        </div>

        {formData.type === "For Sale" && (
          <div className="form-group">
            <label htmlFor="price">Price (₹) *</label>
            <input
              id="price"
              name="price"
              type="number"
              min="1"
              value={formData.price}
              onChange={handleChange}
              placeholder="Enter price"
              required
            />
          </div>
        )}
      </div>

      {formData.type === "Exchange" && (
        <div className="form-group">
          <label htmlFor="exchangeFor">What would you like in exchange?</label>
          <input
            id="exchangeFor"
            name="exchangeFor"
            value={formData.exchangeFor}
            onChange={handleChange}
            placeholder="e.g. Another reference book"
            required
          />
        </div>
      )}

      <div className="form-group">
        <label htmlFor="location">Campus Location *</label>
        <input
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g. JIIT Sector 62"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="image">Listing Image</label>

        <label className="listing-image-upload" htmlFor="image">
          <ImagePlus size={24} />
          <span>{image ? image.name : "Choose an image (optional)"}</span>
          <small>Upload a clear image of your resource</small>
        </label>

        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={(event) => setImage(event.target.files[0] || null)}
          hidden
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Publishing..." : submitLabel}
      </Button>
    </form>
  );
}

export default ListingForm;
