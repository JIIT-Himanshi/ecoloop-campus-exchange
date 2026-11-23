
import { useEffect, useState } from "react";
import { Search, Users, Ban, CheckCircle } from "lucide-react";
import API from "../services/api";
import Loader from "../components/common/Loader";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/admin/users");
      setUsers(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId, isActive) => {
    try {
      setUpdating(userId);
      setError("");

      await API.patch(`/admin/users/${userId}/status`, {
        isActive: !isActive,
      });

      await fetchUsers();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update user."
      );
    } finally {
      setUpdating("");
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase();

    return (
      user.name?.toLowerCase().includes(searchText) ||
      user.email?.toLowerCase().includes(searchText) ||
      user.studentId?.toLowerCase().includes(searchText)
    );
  });

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">COMMUNITY MANAGEMENT</span>
          <h1>Manage Users</h1>
          <p>View and manage registered EcoLoop students.</p>
        </div>
      </div>

      <div className="manage-search users-search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by name, email or student ID..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && <div className="page-error">{error}</div>}

      {loading ? (
        <Loader message="Loading students..." />
      ) : filteredUsers.length === 0 ? (
        <div className="page-empty">
          <Users size={32} />
          <h3>No students found</h3>
          <p>No users match your search.</p>
        </div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>EcoPoints</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <strong>{user.name}</strong>
                    <span className="user-email">{user.email}</span>
                  </td>

                  <td>{user.studentId}</td>
                  <td>{user.ecoPoints ?? 0}</td>
                  <td>{user.role}</td>

                  <td>
                    <span
                      className={`status-badge ${
                        user.isActive === false ? "rejected" : "completed"
                      }`}
                    >
                      {user.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </td>

                  <td>
                    {user.role !== "admin" && (
                      <button
                        className="user-status-button"
                        onClick={() =>
                          handleStatusChange(user._id, user.isActive !== false)
                        }
                        disabled={updating === user._id}
                      >
                        {user.isActive === false ? (
                          <>
                            <CheckCircle size={15} /> Activate
                          </>
                        ) : (
                          <>
                            <Ban size={15} /> Deactivate
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default ManageUsers;
