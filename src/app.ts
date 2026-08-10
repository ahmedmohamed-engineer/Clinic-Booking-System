import path from "node:path";
import express from "express";
import cors from "cors";
import { uploadConfig } from "./config/upload.js";
import { ensureUploadsDirectory } from "./services/avatar-storage.service.js";
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";
import routes from "./routes/index.js";

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.resolve(uploadConfig.dir), { maxAge: "7d" }),
);
app.use("/api/v1", routes);
app.use(errorMiddleware);

ensureUploadsDirectory();

export default app;