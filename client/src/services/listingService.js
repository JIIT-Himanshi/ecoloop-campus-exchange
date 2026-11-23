
import API from "./api";

export const getListings = async (filters = {}) => {
  const response = await API.get("/listings", { params: filters });
  return response.data;
};

export const createListing = async (listingData) => {
  const formData = new FormData();

  Object.entries(listingData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      formData.append(key, value);
    }
  });

  const response = await API.post("/listings", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getMyListings = async () => {
  const response = await API.get("/listings/my-listings");
  return response.data;
};

export const getListingById = async (listingId) => {
  const response = await API.get(`/listings/${listingId}`);
  return response.data;
};

export const updateListing = async (listingId, listingData) => {
  const response = await API.put(`/listings/${listingId}`, listingData);
  return response.data;
};

export const deleteListing = async (listingId) => {
  const response = await API.delete(`/listings/${listingId}`);
  return response.data;
};
