export default {
  LOG_LEVEL: (process.env.LOG_LEVEL as "debug" | "info" | "warn" | "error") || "info",
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  BROWSER: (process.env.BROWSER_TYPE as "chromium" | "firefox" | "webkit") || "chromium",
  ACCESS_TOKEN: process.env.ACCESS_TOKEN || undefined,
};
