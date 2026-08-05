import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

import app from "./app.js";
import logger from "./utils/logger.js";

const port = process.env.PORT || 3000;

connectDB()
  .then(() => {
    const server = app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
    server.on("error", (err) => {
      logger.error(err, "Server encountered an error");
    });
  })
  .catch((err) => {
    logger.error(err, "MongoDb connection error");
  });
