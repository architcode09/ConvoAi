import express from "express";

import "dotenv/config";

import fs from "fs";
import path from "path";

import { clerkMiddleware } from "@clerk/express";

import { connectDB } from "./lib/db.js";
import job from "./lib/cron.js";

import clerkWebhook from "./webhooks/clerk.webhook.js";
import authRoutes from "./routes/auth.route.js";
import aiRoutes from "./routes/ai.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL?.trim();
const allowedOrigins = FRONTEND_URL ? FRONTEND_URL.split(",").map((origin) => origin.trim()) : [];

const publicDir = path.join(process.cwd(), "public");

// it's important that you don't parse the webhook event data, it should be in the raw format
app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }), clerkWebhook);

app.use(express.json());

// Custom CORS middleware — replaces the `cors` package so we have access to
// `req.headers.host`. This is needed because Vite adds crossorigin="" to
// script/link tags in production builds, which causes the browser to send an
// Origin header even for same-domain asset loads (e.g. on Render the frontend
// origin is https://convoai-2ntn.onrender.com, same as the backend host).
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.headers.host;

  const isSameOrigin =
    host &&
    (origin === `https://${host}` || origin === `http://${host}`);

  const isAllowed =
    !origin ||                         // no Origin header = same-site / server request
    allowedOrigins.length === 0 ||     // no allow-list configured = allow all
    allowedOrigins.includes(origin) || // explicitly listed origin
    isSameOrigin;                      // app's own domain (covers Vite crossorigin assets)

  if (isAllowed) {
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }

  // Handle preflight
  if (req.method === "OPTIONS") {
    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Max-Age", "86400");
      return res.status(204).end();
    }
    return res.status(403).json({ message: "CORS origin not allowed" });
  }

  if (!isAllowed) {
    return res.status(403).json({ message: "CORS origin not allowed" });
  }

  next();
});
app.use(clerkMiddleware());

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ai", aiRoutes);
app.use((error, req, res, next) => {
  if (error?.name === "MulterError") {
    return res.status(400).json({ message: error.message });
  }

  if (error?.message === "Only image and video uploads are allowed") {
    return res.status(400).json({ message: error.message });
  }

  if (error) {
    console.error("Unhandled server error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }

  next();
});

// if the public directory exists, serve the static files
// this is for the production build
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  // Serve the SPA for all non-API, non-health routes
  // Using a regex to exclude /api/* and /health so those routes still work
  app.get(/^(?!\/api(?:\/|$)|\/health$).*/, (req, res, next) => {
    res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
  });
}

server.on("error", (error) => {
  if (error?.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing server or change PORT.`);
    process.exit(1);
  }

  console.error("Server failed to start:", error);
  process.exit(1);
});

server.listen(PORT, () => {
  connectDB();
  console.log("Server is up and running on PORT:", PORT);

  if (process.env.NODE_ENV === "production") job.start();
});
