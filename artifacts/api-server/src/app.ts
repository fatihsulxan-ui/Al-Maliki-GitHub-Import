import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const allowedOrigins = (process.env["ALLOWED_ORIGINS"] || "").split(",").map(v => v.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : false,
  credentials: false,
}));
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false, limit: "64kb" }));

app.use("/api", router);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err && typeof err === "object" && "type" in err && (err as { type?: string }).type === "entity.too.large") {
    res.status(413).json({ error: "Request too large" }); return;
  }
  res.status(500).json({ error: "Internal server error" });
});

export default app;
