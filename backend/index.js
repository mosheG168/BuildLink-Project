import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import morgan from "morgan";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import usersRouter from "./src/routes/users.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: "GET,PUT,POST,DELETE,PATCH,OPTIONS",
    allowedHeaders: "Content-Type, Accept, Authorization",
  })
);

// daily error logs
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

// DB connect (local only)
await mongoose.connect(MONGO_URI);
console.log("✅ MongoDB (local) connected");

app.use("/api/users", usersRouter);
app.get("/", (req, res) => res.json({ message: "API is running" }));

app.use((req, res) => {
  res.status(404);
  res.locals.errorMessage = "Route not found";
  res.json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);
  res.locals.errorMessage = err.message;
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
