import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import logger from "./utils/logger.js";

dotenv.config();

const app = express();

// Security HTTP Headers
app.use(helmet());

import Stripe from "stripe";

import { User } from "./models/user.model.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const processSuccessfulSubscription = async (session) => {
  const userEmail = session.customer_details?.email;
  if (!userEmail) return;

  const purchasedPlan = session.metadata?.plan || "Pro Creator";
  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  logger.info(
    {
      ...(stripeCustomerId ? { stripeCustomerId } : {}),
      purchasedPlan,
    },
    "Stripe payment successful",
  );

  try {
    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail.toLowerCase() },
      {
        $set: {
          subscriptionPlan: purchasedPlan,
          ...(stripeCustomerId ? { stripeCustomerId } : {}),
        },
      },
      { returnDocument: "after" },
    );

    if (!updatedUser) {
      logger.warn(
        { ...(stripeCustomerId ? { stripeCustomerId } : {}) },
        "Webhook Warning: User not found in database",
      );
      return;
    }

    logger.info(
      {
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
        purchasedPlan,
      },
      "Subscription plan updated for user",
    );
  } catch (dbErr) {
    logger.error(
      { err: dbErr },
      "Error updating user subscription in database",
    );
    throw dbErr;
  }
};

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      logger.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type !== "checkout.session.completed") {
      return res.json({ received: true });
    }

    try {
      await processSuccessfulSubscription(event.data.object);
      return res.json({ received: true });
    } catch (error) {
      logger.error({ err: error }, "Webhook processing failed");
      return res.status(500).json({ received: false });
    }
  },
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

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

import { globalLimiter } from "./middlewares/rateLimiter.middleware.js";

app.use("/api", globalLimiter);

import userRoute from "./routes/user.routes.js";
import noteRoute from "./routes/note.routes.js";
import paymentRoute from "./routes/payment.route.js";
import aiRoutes from './routes/ai.routes.js';

app.use("/api/v1/users", userRoute);
app.use("/api/v1/notes", noteRoute);
app.use("/api/v1/stripe", paymentRoute);
app.use('/api/v1/ai', aiRoutes);

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
