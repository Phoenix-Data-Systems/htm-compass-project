function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnvironmentVariable(
  name: string
): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 3001);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }

  return port;
}

function parseOptionalPort(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid TCP port");
  }

  return port;
}

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const nodeEnvironment =
  process.env.NODE_ENV?.trim().toLowerCase() ?? "development";

const isProduction = nodeEnvironment === "production";

export const environment = {
  nodeEnvironment,
  isProduction,
  port: parsePort(process.env.PORT),

  dbServer: requireEnvironmentVariable(
    isProduction ? "SQL_SERVER" : "DB_SERVER"
  ),

  dbDatabase: requireEnvironmentVariable(
    isProduction ? "SQL_DATABASE" : "DB_DATABASE"
  ),

  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),

  smtpHost: getOptionalEnvironmentVariable("SMTP_HOST"),
  smtpPort: parseOptionalPort(process.env.SMTP_PORT),
  smtpUser: getOptionalEnvironmentVariable("SMTP_USER"),
  smtpPassword: getOptionalEnvironmentVariable("SMTP_PASSWORD"),
  mailFrom: getOptionalEnvironmentVariable("MAIL_FROM"),
  appBaseUrl: getOptionalEnvironmentVariable("APP_BASE_URL")
};