const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// Base test route
app.get("/", (req, res) => {
  res.send("EcoLoop API is running");
});

// Health check endpoint verifying server status & MongoDB connection state
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const isDbConnected = dbState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    message: isDbConnected
      ? "EcoLoop API and database are operational"
      : "EcoLoop API is running but database is not connected",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbStatusMap[dbState] || "unknown",
      readyState: dbState,
    },
  });
});

// 404 Handler for undefined routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

/**
 * Starts the server only after successful connection to MongoDB.
 */
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
      );
    });
    return server;
  } catch (error) {
    console.error("Unable to start server: MongoDB connection failed.");
    console.error("Please configure a valid MONGO_URI in server/.env");
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
