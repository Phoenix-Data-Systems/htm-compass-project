import { createRequire } from "node:module";
import type { config as SqlConfig, ConnectionPool } from "mssql";
import { environment } from "./environment.js";

const require = createRequire(import.meta.url);

const sql = environment.isProduction
  ? (require("mssql") as typeof import("mssql"))
  : (require("mssql/msnodesqlv8") as typeof import("mssql"));

const poolOptions = {
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000
};

const databaseConfig: SqlConfig = environment.isProduction
  ? {
      server: environment.dbServer,
      database: environment.dbDatabase,
      authentication: {
        type: "azure-active-directory-msi-app-service",
        options: {}
      },
      options: {
        encrypt: true,
        trustServerCertificate: false
      },
      pool: poolOptions
    }
  : {
      server: environment.dbServer,
      database: environment.dbDatabase,
      options: {
        trustedConnection: true,
        trustServerCertificate: true
      },
      pool: poolOptions
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
