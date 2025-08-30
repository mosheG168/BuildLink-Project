// index.js
// Purpose: App bootstrap. Loads env, connects to Mongo (Atlas/local), mounts middleware & routes,
// starts server only after DB is connected.

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import morgan from "morgan";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import usersRouter from "./src/routes/users.js";

// Load chosen env file (default .env). To use Atlas: ENV_FILE=.env.atlas node index.js
// To use local run: nodemon
const ENV_FILE = process.env.ENV_FILE || ".env";
dotenv.config({ path: ENV_FILE });

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

// Sanity check (fail fast if misconfigured)
if (!MONGO_URI) {
  console.error(`❌ Missing MONGO_URI in ${ENV_FILE}`);
  process.exit(1);
}

// ----- Middleware -----
app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: "GET,PUT,POST,DELETE,PATCH,OPTIONS",
    // include x-auth-token since we both set and read it
    allowedHeaders: "Content-Type, Accept, Authorization, x-auth-token",
  })
);

// Daily error logs (simple file logger)
app.use((req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode >= 400) {
      const logDir = path.join(process.cwd(), "logs");
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
      const logFile = path.join(
        logDir,
        `${new Date().toISOString().slice(0, 10)}.log`
      );
      const errorMessage = res.locals.errorMessage || res.statusMessage || "";
      fs.appendFileSync(
        logFile,
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${
          res.statusCode
        } ${errorMessage}\n`
      );
    }
  });
  next();
});

// ----- Routes -----
app.use("/api/users", usersRouter);
app.get("/", (_req, res) => res.json({ message: "API is running" }));

// 404
app.use((req, res) => {
  res.status(404);
  res.locals.errorMessage = "Route not found";
  res.json({ error: "Route not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("🔥 Error:", err);
  res.locals.errorMessage = err.message;
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

// ----- Start server after DB connects -----
async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      // dbName can be supplied in the URI (/mydb). If omitted, Atlas defaults to "test".
      // You can also set: dbName: "final_project"
    });
    const host = MONGO_URI.includes("@")
      ? MONGO_URI.split("@")[1]?.split("/")[0]
      : "local";
    console.log(`✅ MongoDB connected: ${host}`);

    app.listen(PORT, () =>
      console.log(
        `🚀 Server ready: http://localhost:${PORT}  (env: ${ENV_FILE})`
      )
    );
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

// Helpful in dev to see unhandled promise errors
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

start();
