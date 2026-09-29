import { createRequire } from "node:module";
import type { config as SqlConfig, ConnectionPool } from "mssql";
import { environment } from "./environment.js";

const require = createRequire(import.meta.url);

const sql = require("mssql/msnodesqlv8") as typeof import("mssql");

const databaseConfig: SqlConfig = {
  server: environment.dbServer,
  database: environment.dbDatabase,
  options: {
    trustedConnection: true,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise: Promise<ConnectionPool> | undefined;

export function getDatabasePool(): Promise<ConnectionPool> {
  if (!poolPromise) {
    poolPromise = sql.connect(databaseConfig).catch((error) => {
      poolPromise = undefined;
      throw error;
    });
  }

  return poolPromise;
}

export { sql };
