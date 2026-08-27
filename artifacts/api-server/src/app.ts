import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttpModule from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const pinoHttp = pinoHttpModule as unknown as (options: { logger: typeof logger }) => any;
const app: Express = express();

app.use(pinoHttp({ logger }));
const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => callback(null, !origin || !allowedOrigins.length || allowedOrigins.includes(origin)) }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.get("/", (_req, res) => res.json({ name: "Home Goods Hub API", status: "ok" }));
app.use("/api", router);
app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  logger.error({ error }, 'Unhandled API error');
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: 'Internal server error' });
});

export default app;

