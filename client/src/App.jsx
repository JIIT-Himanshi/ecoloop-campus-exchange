import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

import Explore from "./pages/Explore";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import CreateListing from "./pages/CreateListing";
import MyListings from "./pages/MyListings";
import ListingDetails from "./pages/ListingDetails";
import MyRequests from "./pages/MyRequests";
import Wishlist from "./pages/Wishlist";
import Transactions from "./pages/Transactions";
import Notifications from "./pages/Notifications";
import SubmitReport from "./pages/SubmitReport";

import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";


import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import ManageListings from "./pages/ManageListings";
import ManageUsers from "./pages/ManageUsers";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/listings/:id" element={<ListingDetails />} />

          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<StudentDashboard />} />
              
              <Route path="listings" element={<MyListings />} />
              <Route path="create" element={<CreateListing />} />
              <Route path="requests" element={<MyRequests />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="report" element={<SubmitReport />} />

            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="listings" element={<ManageListings />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
