const cloudinary = require("cloudinary").v2;
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Configure Cloudinary instance
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer directly to Cloudinary using upload_stream.
 * Avoids saving files to the server filesystem.
 *
 * @param {Buffer} buffer - File buffer from Multer memory storage
 * @param {string} folder - Target folder name on Cloudinary
 * @returns {Promise<string>} - Resolves with the secure_url of uploaded image
 */
const uploadToCloudinary = (buffer, folder = "ecoloop/listings") => {
  return new Promise((resolve, reject) => {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return reject(
        new Error("Cloudinary credentials are not configured in server/.env")
      );
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};

