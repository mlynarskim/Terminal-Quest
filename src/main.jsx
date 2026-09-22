import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Vercel Analytics (privacy-friendly, no cookies)
if (import.meta.env.PROD) {
  import('@vercel/analytics/react').then(({ Analytics: _Analytics }) => {
    // Injected via wrapper below
  });
}

// Sentry error tracking (optional, requires VITE_SENTRY_DSN)
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: 'production',
      release: import.meta.env.VITE_APP_VERSION || 'dev',
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.0,
      beforeSend(event) {
        // Strip localStorage from error payloads
        if (event.exception) return event;
        return null;
      },
    });
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
