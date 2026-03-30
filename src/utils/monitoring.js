import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export const initMonitoring = () => {
  // Only initialize in production
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN, // You'll get this from sentry.io
      integrations: [new BrowserTracing()],
      tracesSampleRate: 1.0,
      environment: import.meta.env.MODE,
      beforeSend(event) {
        // Don't send sensitive info
        if (event.request?.headers) {
          delete event.request.headers.Authorization;
        }
        return event;
      },
    });
  }
};

export const logError = (error, context = {}) => {
  console.error(error, context);
  if (import.meta.env.PROD) {
    Sentry.captureException(error, { extra: context });
  }
};

export const logMessage = (message, level = 'info') => {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level);
  }
};