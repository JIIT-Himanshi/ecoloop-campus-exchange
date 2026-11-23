
import API from "./api";

export const sendRequest = async (listingId, message = "") => {
  const response = await API.post(`/requests/${listingId}`, { message });
  return response.data;
};

export const getSentRequests = async () => {
  const response = await API.get("/requests/sent");
  return response.data;
};

export const getReceivedRequests = async () => {
  const response = await API.get("/requests/received");
  return response.data;
};

export const updateRequestStatus = async (requestId, status) => {
  const response = await API.patch(`/requests/${requestId}/status`, {
    status,
  });

  return response.data;
};
