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
 * Formats and outputs errors.
 * Centralizing this enables future connection to remote logging providers (e.g. Sentry).
 * @param {string} contextName - The component or module where the error occurred
 * @param {Error|AppError|string} err - The error object or message
 */
export function logError(contextName, err) {
  const errorObj = err instanceof Error ? err : new Error(String(err));
  const timestamp = new Date().toISOString();
  
  const logMessage = `[ERROR] [${timestamp}] [Context: ${contextName}] - Message: ${errorObj.message}`;
  
  // Output warning/error depending on environment or severity
  // Using console.error directly is allowed here as this is our central logger
  console.error(logMessage, {
    stack: errorObj.stack,
    context: err instanceof AppError ? err.context : {},
  });
  
  return logMessage;
}
