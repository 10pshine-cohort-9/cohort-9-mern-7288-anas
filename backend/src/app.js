import express from "express"
import cors from "cors"

const app = express()

// Configurations

//  app.use -> middleware

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true , limit: "16kb"}))
app.use(express.static("public"))

// cors configurations

app.use(cors({
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
        : "http://localhost:5173",
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
app.get("/" , (req , res) => {
    res.send("Welcom to NotesApp");
})




export default app