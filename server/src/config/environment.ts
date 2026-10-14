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

  appBaseUrl: getOptionalEnvironmentVariable("APP_BASE_URL"),
  acsEmailEndpoint: getOptionalEnvironmentVariable("ACS_EMAIL_ENDPOINT"),
  acsEmailSender: getOptionalEnvironmentVariable("ACS_EMAIL_SENDER")
};
