const multer = require("multer");

// Store files in memory buffer for direct streaming to Cloudinary
const storage = multer.memoryStorage();

// Validate file types (JPEG, PNG, WebP)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      "Invalid file format. Only JPEG, PNG, and WebP images are allowed."
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

// Multer upload middleware with 5MB limit and max 5 files
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 5,                  // Max 5 images per listing
  },
});

module.exports = upload;

