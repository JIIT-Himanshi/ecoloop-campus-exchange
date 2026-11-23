
import { useEffect, useState } from "react";
import { ArrowLeftRight, CheckCircle2 } from "lucide-react";
import {
  getMyTransactions,
  confirmTransaction,
} from "../services/transactionService";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyTransactions();
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleConfirm = async (transactionId) => {
    try {
      setConfirming(transactionId);
      setError("");

      await confirmTransaction(transactionId);
      await fetchTransactions();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to confirm transaction."
      );
    } finally {
      setConfirming("");
    }
  };

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">EXCHANGE HISTORY</span>
          <h1>Transactions</h1>
          <p>Track the progress of your completed exchanges and donations.</p>
        </div>
      </div>

      {error && <div className="page-error">{error}</div>}

      {loading ? (
        <Loader message="Loading transactions..." />
      ) : transactions.length === 0 ? (
        <div className="page-empty">
          <ArrowLeftRight size={32} />
          <h3>No transactions yet</h3>
          <p>Your confirmed resource exchanges will appear here.</p>
        </div>
      ) : (
        <div className="transaction-list">
          {transactions.map((transaction) => (
            <article className="transaction-card" key={transaction._id}>
              <div className="transaction-icon">
                <ArrowLeftRight size={22} />
              </div>

              <div className="transaction-info">
                <h3>
                  {transaction.listing?.title || "Resource transaction"}
                </h3>

                <p>
                  {transaction.status || "In Progress"}
                </p>

                <span>
                  {transaction.createdAt
                    ? new Date(transaction.createdAt).toLocaleDateString()
                    : ""}
                </span>
              </div>

              <div className="transaction-action">
                <span
                  className={`status-badge ${
                    transaction.status?.toLowerCase() || "pending"
                  }`}
                >
                  {transaction.status || "Pending"}
                </span>

                {transaction.status === "In Progress" &&
                  !transaction.currentUserConfirmed && (
                    <Button
                      onClick={() => handleConfirm(transaction._id)}
                      disabled={confirming === transaction._id}
                    >
                      <CheckCircle2 size={16} />
                      Confirm Completion
                    </Button>
                  )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Transactions;
