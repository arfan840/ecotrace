/**
 * Centralized Error Handling System for EcoTrace
 */

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
 * Formats and outputs errors in a structured JSON format (Pino-like structure).
 * Centralizing this enables future connection to remote logging providers (e.g. Sentry).
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
  
  // Output structured JSON object
  console.error(JSON.stringify(logStructure));
  
  return logStructure;
}

