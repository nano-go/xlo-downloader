export function formatError(
  error: unknown,
  or: string | ((error: unknown) => string) = "unknown error",
) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error) {
    return error;
  }

  return typeof or === "string" ? or : or(error);
}
