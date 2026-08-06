import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import logger from "./logger.js";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    logger.info("File is uploaded on cloudinary", response.url);
    return response;
  } catch (error) {
    logger.error(error, "Error on Cloudinary");
    if (fs.existsSync) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info("Deleted from cloudinary. Public Id", publicId);
    return result;
  } catch (error) {
    logger.error(error, "Error deleting from cloudinary");
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
