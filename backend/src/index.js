import dotenv from "dotenv";

// 1. Load environment variables FIRST before doing anything else
dotenv.config({ path: "./.env" });

// 2. NOW import the app, so it has access to process.env.CORS_ORIGIN
import app from "./app.js";

// 3. Set the port, falling back to 5000 if the .env variable is missing
const PORT = process.env.PORT || 5000;

// 4. Start the HTTP server and bind it to the port
app.listen(PORT, () => {
  console.log(`Server successfully started and listening on port ${PORT}`);
});