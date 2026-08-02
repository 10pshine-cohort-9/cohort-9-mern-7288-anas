import dotenv from "dotenv"

dotenv.config({
    path: "./.env"
})

import app  from "./app.js"

/**
 * Validates and normalizes the server port.
 *
 * @param {string | number | undefined} val - Raw port value from environment.
 * @param {number} [defaultPort=5000] - Fallback port when val is undefined or empty.
 * @returns {number} Validated port number between 0 and 65535.
 * @throws {Error} If port is not a valid integer or outside the range 0-65535.
 */
function normalizePort(val, defaultPort = 5000) {
    if (val === undefined || val === null || val === "") {
        return defaultPort
    }
    const trimmed = String(val).trim()
    if (!trimmed) {
        return defaultPort
    }
    if (!/^\d+$/.test(trimmed)) {
        throw new Error(`Invalid PORT "${val}": PORT must be a numeric integer. Nonnumeric values are rejected.`)
    }
    const portNumber = Number(trimmed)
    if (portNumber < 0 || portNumber > 65535) {
        throw new Error(`Invalid PORT ${portNumber}: PORT must be between 0 and 65535.`)
    }
    return portNumber
}

const PORT = normalizePort(process.env.PORT, 5000)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})