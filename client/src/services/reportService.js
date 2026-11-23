import API from "./api";

export const submitReport = async (report) => {
  const response = await API.post("/reports", report);
  return response.data;
};
