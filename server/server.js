require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map((item) => item.trim()) : "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => res.json({ status: "ok", message: "EcoLoop API is running." }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/wishlist", require("./routes/wishlistRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use(notFound);
app.use(errorHandler);

const createInitialAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_STUDENT_ID, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_STUDENT_ID || !ADMIN_PASSWORD) return;

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Initial admin already exists; bootstrap skipped.");
    return;
  }

  const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.create({
    name: ADMIN_NAME.trim(),
    email,
    studentId: ADMIN_STUDENT_ID.trim(),
    password,
    role: "admin",
    isActive: true,
  });
  console.log("Initial admin account created from environment settings.");
};

const PORT = process.env.PORT || 5000;

connectDB()
  .then(createInitialAdmin)
  .then(() => {
    app.listen(PORT, () => console.log(`EcoLoop server running on port ${PORT}.`));
  })
  .catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  });

module.exports = app;
