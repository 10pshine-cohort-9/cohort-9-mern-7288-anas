import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
import Stripe from "stripe";

import { User } from "./models/user.model.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
      console.error(`❌ Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userEmail = session.customer_details?.email;
      const purchasedPlan = session.metadata?.plan || "Pro Creator";
      const stripeCustomerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;

      console.log(
        "💰 Payment successful for:",
        userEmail,
        "Plan:",
        purchasedPlan,
      );

      if (userEmail) {
        try {
          const updatedUser = await User.findOneAndUpdate(
            { email: userEmail.toLowerCase() },
            {
              $set: {
                subscriptionPlan: purchasedPlan,
                ...(stripeCustomerId ? { stripeCustomerId } : {}),
              },
            },
            { new: true },
          );

          if (updatedUser) {
            console.log(
              `✅ Subscription plan updated to "${purchasedPlan}" for user: ${userEmail}`,
            );
          } else {
            console.warn(
              `⚠️ Webhook Warning: User with email "${userEmail}" not found in database.`,
            );
          }
        } catch (dbErr) {
          console.error(
            `❌ Error updating user subscription in database: ${dbErr.message}`,
          );
        }
      }
    }

    res.json({ received: true });
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

app.use("/api/v1/users", userRoute);
app.use("/api/v1/notes", noteRoute);
app.use("/api/v1/stripe", paymentRoute);

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
