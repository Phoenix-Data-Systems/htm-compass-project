import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { getDatabasePool } from "./config/database.js";
import { environment } from "./config/environment.js";
import { surveyRouter } from "./routes/surveyRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (environment.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const corsError = new Error("Origin not allowed by CORS") as Error & {
        statusCode?: number;
      };

      corsError.statusCode = 403;
      callback(corsError);
    }
  })
);

app.use(express.json({ limit: "100kb" }));

app.use("/api/surveys", surveyRouter);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "swot-api"
  });
});

app.get("/api/db-test", async (_req, res) => {
  try {
    const pool = await getDatabasePool();

    const result = await pool.request().query(`
      SELECT
        DB_NAME() AS DatabaseName,
        @@SERVERNAME AS ServerName,
        COUNT(*) AS StatementCount
      FROM dbo.Statements;
    `);

    res.status(200).json({
      status: "ok",
      database: result.recordset[0]
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed"
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found"
  });
});

app.use(errorHandler);

app.listen(environment.port, () => {
  console.log(`SWOT API running on port ${environment.port}`);
});

