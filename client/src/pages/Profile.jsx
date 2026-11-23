
import { useEffect, useState } from "react";
import { UserRound, Save } from "lucide-react";
import API from "../services/api";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";

function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    studentId: "",
    ecoPoints: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const response = await API.get("/auth/me");
        const user = response.data.user;

        setProfile({
          name: user.name || "",
          email: user.email || "",
          studentId: user.studentId || "",
          ecoPoints: user.ecoPoints || 0,
        });
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await API.put("/users/profile", {
        name: profile.name,
      });

      const updatedUser = response.data.user;

      setProfile((previous) => ({
        ...previous,
        ...updatedUser,
      }));

      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Loading your profile..." />;
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">ACCOUNT SETTINGS</span>
          <h1>My Profile</h1>
          <p>View and manage your student account details.</p>
        </div>
      </div>

      <div className="profile-panel">
        <div className="profile-header">
          <div className="profile-avatar">
            <UserRound size={32} />
          </div>

          <div>
            <h2>{profile.name || "Student"}</h2>
            <p>{profile.email}</p>
          </div>
        </div>

        <div className="eco-points-panel">
          <span>YOUR ECOPOINTS</span>
          <strong>{profile.ecoPoints}</strong>
          <p>Points earned through completed exchanges.</p>
        </div>

        {error && <div className="page-error">{error}</div>}
        {success && <div className="page-success">{success}</div>}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-field">
            <label htmlFor="profile-name">Full Name</label>
            <input
              id="profile-name"
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="profile-field">
            <label htmlFor="profile-email">Email Address</label>
            <input
              id="profile-email"
              type="email"
              value={profile.email}
              readOnly
            />
          </div>

          <div className="profile-field">
            <label htmlFor="profile-student-id">Student ID</label>
            <input
              id="profile-student-id"
              type="text"
              value={profile.studentId}
              readOnly
            />
          </div>

          <Button type="submit" disabled={saving}>
            <Save size={17} />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </section>
  );
}

export default Profile;
