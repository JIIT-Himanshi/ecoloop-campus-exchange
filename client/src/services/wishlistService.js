
import API from "./api";

export const getWishlist = async () => {
  const response = await API.get("/wishlist");
  return response.data;
};

export const addToWishlist = async (listingId) => {
  const response = await API.post("/wishlist", { listingId });
  return response.data;
};

export const removeFromWishlist = async (listingId) => {
  const response = await API.delete(`/wishlist/${listingId}`);
  return response.data;
};
