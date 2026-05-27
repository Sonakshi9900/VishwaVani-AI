// sentry.setup.js
// Sentry Error Tracking — Frontend (React) + Backend (Express)
// npm install @sentry/react @sentry/node @sentry/profiling-node

// ══════════════════════════════════════════════════════════════════
// FRONTEND: src/sentry.js
// Import this FIRST in main.jsx / index.js
// ══════════════════════════════════════════════════════════════════
import * as Sentry from "@sentry/react";

export function initSentryFrontend() {
  if (import.meta.env.MODE !== "production") return; // Only in prod

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.2,      // 20% of transactions
    replaysSessionSampleRate: 0.05, // 5% session replay
    replaysOnErrorSampleRate: 1.0,  // 100% on error

    beforeSend(event) {
      // Don't send if user is dev
      if (window.location.hostname === "localhost") return null;
      return event;
    },
  });
}

// Custom error boundary for React
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Capture custom events (e.g., AI API failures)
export function captureAIError(error, context = {}) {
  Sentry.captureException(error, {
    tags: { component: "AI-Chat" },
    extra: context,
  });
}

// ══════════════════════════════════════════════════════════════════
// BACKEND: server/sentry.js
// Call initSentryBackend() at TOP of server/index.js — before other imports
// ══════════════════════════════════════════════════════════════════

// ⚠️ In your backend file, use:
// import * as SentryNode from "@sentry/node";
// import { nodeProfilingIntegration } from "@sentry/profiling-node";

/*
// server/sentry.js (CommonJS / ESM backend)

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

export function initSentryBackend() {
  if (process.env.NODE_ENV !== "production") return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN_BACKEND,
    integrations: [
      nodeProfilingIntegration(),
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE || "unknown",

    beforeSend(event) {
      // Scrub sensitive data before sending
      if (event.request?.headers?.authorization) {
        event.request.headers.authorization = "[REDACTED]";
      }
      return event;
    },
  });
}

// Express middleware (add AFTER routes, BEFORE other error handlers)
export const sentryErrorHandler = Sentry.expressErrorHandler({
  shouldHandleError(error) {
    // Only report 500+ errors (not 404s)
    return !error.status || error.status >= 500;
  },
});

// Usage in server/index.js:
// import { initSentryBackend, sentryErrorHandler } from './sentry.js';
// initSentryBackend(); // ← MUST be first
// ...all your middleware and routes...
// app.use(sentryErrorHandler); // ← LAST middleware
*/

// ══════════════════════════════════════════════════════════════════
// USAGE IN main.jsx
// ══════════════════════════════════════════════════════════════════
/*
// src/main.jsx
import { initSentryFrontend, SentryErrorBoundary } from './sentry.js';
initSentryFrontend();

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <SentryErrorBoundary
    fallback={({ error, resetError }) => (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Kuch gadbad ho gayi 😕</h2>
        <p>Error: {error?.message}</p>
        <button onClick={resetError}>Dobara try karo</button>
      </div>
    )}
  >
    <App />
  </SentryErrorBoundary>
);
*/

// ══════════════════════════════════════════════════════════════════
// ENVIRONMENT VARIABLES NEEDED
// ══════════════════════════════════════════════════════════════════
/*
# .env (frontend)
VITE_SENTRY_DSN=https://xxxxx@o0.ingest.sentry.io/xxxxx

# .env (backend)
SENTRY_DSN_BACKEND=https://yyyyy@o0.ingest.sentry.io/yyyyy
SENTRY_AUTH_TOKEN=sntrys_zzzzz  (for CI/CD release creation)
SENTRY_ORG=your-org-slug
*/

export default initSentryFrontend;
