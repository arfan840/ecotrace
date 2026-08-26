import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppError, logError } from '../lib/errors';

describe('Centralized Error Handling System', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should create an AppError instance with default status and context', () => {
    const error = new AppError('Database connection failed', { query: 'SELECT 1' });
    expect(error.message).toBe('Database connection failed');
    expect(error.context).toEqual({ query: 'SELECT 1' });
    expect(error.statusCode).toBe(500);
    expect(error.timestamp).toBeDefined();
  });

  it('should format and log simple string errors', () => {
    const logMsg = logError('AuthModule', 'Invalid session key');
    
    expect(logMsg).toContain('[ERROR]');
    expect(logMsg).toContain('[Context: AuthModule]');
    expect(logMsg).toContain('Invalid session key');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid session key'),
      expect.any(Object)
    );
  });

  it('should format and log Error instances', () => {
    const testError = new TypeError('Cannot read properties of undefined');
    const logMsg = logError('BagsAPI', testError);
    
    expect(logMsg).toContain('[Context: BagsAPI]');
    expect(logMsg).toContain('Cannot read properties of undefined');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });
});
