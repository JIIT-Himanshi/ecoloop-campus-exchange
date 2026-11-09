/**
 * 404 Not Found Middleware
 * Catches any request that does not match a defined route and passes a 404 error down.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized Error Handling Middleware
 * Converts any caught exceptions or next(err) calls into consistent JSON responses.
 */
const errorHandler = (err, req, res, next) => {
  // Determine status code (check response first, then custom error status, default to 500)
  let statusCode =
    res.statusCode !== 200
      ? res.statusCode
      : err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  // Handle Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found (invalid ID format)";
  }

  // Handle Mongoose Schema Validation Errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const duplicateField = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value entered for ${duplicateField}. Must be unique.`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};

