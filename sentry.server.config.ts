import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://placeholder-dsn@sentry.io/0",
  tracesSampleRate: 1.0,
});
