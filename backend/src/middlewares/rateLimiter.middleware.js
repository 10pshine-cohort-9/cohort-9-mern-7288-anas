import dotenv from "dotenv";
import { createClient } from "redis";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import logger from "../utils/logger.js";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  logger.error(err , "Redis Client Error:");
});

await redisClient.connect().catch((err) => {
  logger.error(err , "Failed to connect to Redis:");

});

export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "rl:global:",
  }),
  skip: () =>
    process.env.NODE_ENV === "test" ||
    process.argv.some((arg) => arg.includes("mocha")),
});

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message:
      "Too many login/register attempts, please try again after 15 minutes.",
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "rl:auth:",
  }),
  skip: () =>
    process.env.NODE_ENV === "test" ||
    process.argv.some((arg) => arg.includes("mocha")),
});
