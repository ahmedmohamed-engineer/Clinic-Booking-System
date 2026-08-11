import path from "node:path";
import express from "express";
import cors from "cors";
import { env, uploadConfig } from "./config/index.js";
import { ensureUploadsDirectory } from "./services/avatar-storage.service.js";
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";
import routes from "./routes/index.js";

const app = express();

const allowedOrigins = (env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.resolve(uploadConfig.dir), { maxAge: "7d" }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/v1", routes);
app.use(errorMiddleware);

ensureUploadsDirectory();

export default app;