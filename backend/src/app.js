import express from "express"
import dotenv from "dotenv"
import cors from "cors"

dotenv.config({
    path: "./.env"
})

const app = express()

// Configurations
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true , limit: "16kb"}))
app.use(express.static("public"))

/**
 * Clean and parse configured CORS origins from environment variable.
 *
 * @param {string | undefined} corsOriginEnv - Comma-separated list of allowed origins.
 * @returns {string[] | string} Array of trimmed origins or fallback origin string.
 */
function getCORSOrigins(corsOriginEnv) {
    if (!corsOriginEnv) {
        return "http://localhost:5173"
    }
    const origins = corsOriginEnv
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    return origins.length > 0 ? origins : "http://localhost:5173"
}

// cors configurations
app.use(cors({
    origin: getCORSOrigins(process.env.CORS_ORIGIN),
    credentials: true,
    methods: ["GET" , "POST" , "PUT" , "PATCH" , "DELETE" , "OPTIONS"],
    allowedHeaders: ["Authorization" , "Content-Type"]
}))

/**
 * Root health check route for NotesApp API.
 *
 * @param {import("express").Request} req - The Express request object.
 * @param {import("express").Response} res - The Express response object.
 * @returns {void}
 */
function handleRootRequest(req, res) {
    res.send("Welcom to NotesApp")
}

app.get("/" , handleRootRequest)

export default app