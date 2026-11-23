const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);

  const status = err.statusCode || (err.name === "ValidationError" ? 400 : 500);
  const message = status === 500 ? "Something went wrong on the server." : err.message;
  res.status(status).json({ message });
};

module.exports = { notFound, errorHandler };
