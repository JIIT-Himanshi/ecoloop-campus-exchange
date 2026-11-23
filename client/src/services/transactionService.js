
import API from "./api";

export const getMyTransactions = async () => {
  const response = await API.get("/transactions/my-transactions");
  return response.data;
};

export const confirmTransaction = async (transactionId) => {
  const response = await API.patch(
    `/transactions/${transactionId}/confirm`
  );

  return response.data;
};
