import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Configurations

//  app.use -> middleware

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// cors configurations

app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
          .map((origin) => origin.trim())
          .filter(Boolean)
      : "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);

// routes

import userRoute from "./routes/user.routes.js";
import noteRoute from "./routes/note.routes.js";

app.use("/api/v1/users", userRoute);
app.use("/api/v1/notes", noteRoute);

// Global error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    statusCode,
    data: null,
    message,
    success: false,
    errors: err.errors || [],
  });
});

export default app;
