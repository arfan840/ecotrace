/**
 * Centralized Error Handling & Observability System for EcoTrace
 */

let errorTransport = null;

/**
 * Configure an external error transport sink (e.g. Sentry, Datadog, or custom collector)
 * @param {Function|null} transportFn - Function receiving the structured error log payload
 */
export function setErrorTransport(transportFn) {
  errorTransport = typeof transportFn === 'function' ? transportFn : null;
}

/**
 * Retrieves the currently configured error transport sink.
 * @returns {Function|null}
 */
export function getErrorTransport() {
  return errorTransport;
}

export class AppError extends Error {
  constructor(message, context = {}, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.context = context;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Formats and outputs errors in a structured JSON format (Pino-like structure)
 * and dispatches to remote error reporting transports (e.g. Sentry) when configured.
 * 
 * @param {string} contextName - The component or module where the error occurred
 * @param {Error|AppError|string} err - The error object or message
 * @returns {Object} The structured log object
 */
export function logError(contextName, err) {
  const errorObj = err instanceof Error ? err : new Error(String(err));
  const timestamp = new Date().toISOString();
  
  const logStructure = {
    level: 'error',
    time: timestamp,
    context: contextName,
    msg: errorObj.message,
    stack: errorObj.stack || '',
    details: err instanceof AppError ? err.context : {},
    statusCode: err instanceof AppError ? err.statusCode : 500
  };
  
  // Output structured JSON object to console
  console.error(JSON.stringify(logStructure));

  // Dispatch to custom registered transport if present
  if (errorTransport) {
    try {
      errorTransport(logStructure, errorObj);
    } catch (_) {
      // Prevent logging transport failures from disrupting application flow
    }
  } else if (typeof window !== 'undefined' && window.Sentry?.captureException) {
    // If Sentry browser SDK is loaded on the window
    try {
      window.Sentry.captureException(errorObj, {
        tags: { context: contextName },
        extra: logStructure.details
      });
    } catch (_) {
      // Best effort
    }
  }
  
  return logStructure;
}
