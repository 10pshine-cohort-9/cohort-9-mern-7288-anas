import dotenv from "dotenv";
import { createClient } from "redis";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

await redisClient.connect().catch((err) => {
  console.error("❌ Failed to connect to Redis:", err);
});

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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
});
