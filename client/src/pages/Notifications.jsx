
import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update notification."
      );
    }
  };

  const handleReadAll = async () => {
    try {
      setError("");
      await markAllNotificationsRead();

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update notifications."
      );
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <section className="dashboard-page">
      <div className="page-heading notification-heading">
        <div>
          <span className="page-eyebrow">UPDATES</span>
          <h1>Notifications</h1>
          <p>Stay updated about your requests and transactions.</p>
        </div>

        {unreadCount > 0 && (
          <Button variant="secondary" onClick={handleReadAll}>
            <CheckCheck size={17} />
            Mark all as read
          </Button>
        )}
      </div>

      {error && <div className="page-error">{error}</div>}

      {loading ? (
        <Loader message="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <div className="page-empty">
          <Bell size={32} />
          <h3>No notifications yet</h3>
          <p>New updates will appear here.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <article
              className={`notification-card ${
                notification.isRead ? "read" : "unread"
              }`}
              key={notification._id}
            >
              <div className="notification-icon">
                <Bell size={19} />
              </div>

              <div className="notification-content">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>

                <span>
                  {notification.createdAt
                    ? new Date(notification.createdAt).toLocaleString()
                    : ""}
                </span>
              </div>

              {!notification.isRead && (
                <button
                  className="notification-read-button"
                  onClick={() => handleRead(notification._id)}
                >
                  Mark read
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Notifications;
