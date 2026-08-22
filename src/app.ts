import path from "node:path";
import express from "express";
import cors from "cors";
import { env, uploadConfig } from "./config/index.js";
import { ensureUploadsDirectory } from "./services/avatar-storage.service.js";
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";
import routes from "./routes/index.js";
import { resolveAllowedOrigins } from "./config/cors.js";

const app = express();

// Express stamps every response with "X-Powered-By: Express" by default,
// which hands attackers free framework/version fingerprinting.
app.disable("x-powered-by");

const allowedOrigins = resolveAllowedOrigins(env.NODE_ENV, env.CORS_ORIGINS);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.resolve(uploadConfig.dir), {
    maxAge: "7d",
    // Uploaded files are images only (re-encoded WebP by the avatar storage
    // service), but defense-in-depth: never let the browser MIME-sniff a
    // served file, regardless of how it is named or requested.
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/v1", routes);
app.use(errorMiddleware);

ensureUploadsDirectory();

export default app;