import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Configurations

//  app.use -> middleware

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser())

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

app.get("/", (req, res) => {
  res.send("Welcome to NotesApp");
});

export default app;