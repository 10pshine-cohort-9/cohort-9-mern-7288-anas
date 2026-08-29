import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { ApiError } from "../utils/ApiError.js";

const tempDir = "./temp";

// Safely create the directory on server startup without the redundant if-check
fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use the asynchronous, non-blocking mkdir during active requests
    // recursive: true automatically handles the scenario where the folder already exists
    fs.mkdir(tempDir, { recursive: true }, (err) => {
      if (err) {
        return cb(new ApiError(500, "Failed to initialize upload directory"), null);
      }
      cb(null, tempDir);
    });
  },
  filename: function (req, file, cb) {
    const secureRandomString = crypto.randomBytes(8).toString("hex");
    const uniqueSuffix = `${Date.now()}-${secureRandomString}`;
    
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (
    file.mimetype &&
    (file.mimetype.startsWith("image/") ||
      allowedMimeTypes.includes(file.mimetype))
  ) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only image files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});