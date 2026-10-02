import type { ErrorRequestHandler } from "express";

type HttpError = Error & {
  statusCode?: number;
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  if (
    error instanceof SyntaxError &&
    typeof error === "object" &&
    error !== null &&
    "body" in error
  ) {
    res.status(400).json({
      status: "error",
      message: "Invalid JSON request body"
    });
    return;
  }

  const httpError = error as HttpError;

  if (httpError.statusCode === 403) {
    res.status(403).json({
      status: "error",
      message: "Origin not allowed"
    });
    return;
  }

  console.error("Unhandled request error:", error);

  res.status(500).json({
    status: "error",
    message: "Internal server error"
  });
};
