import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logError, AppError, setErrorTransport, getErrorTransport } from '../../lib/errors';

describe('Remote Error Transport & Sentry Integration', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    setErrorTransport(null);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    setErrorTransport(null);
    delete window.Sentry;
  });

  it('should allow setting and retrieving custom error transport sink', () => {
    const mockTransport = vi.fn();
    setErrorTransport(mockTransport);
    expect(getErrorTransport()).toBe(mockTransport);

    setErrorTransport(null);
    expect(getErrorTransport()).toBeNull();
  });

  it('should forward structured errors to registered error transport', () => {
    const mockTransport = vi.fn();
    setErrorTransport(mockTransport);

    const testError = new AppError('Database write conflict', { rowId: 'row-99' }, 409);
    const result = logError('PlantTreatment.saveBatch', testError);

    expect(mockTransport).toHaveBeenCalledTimes(1);
    expect(mockTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        context: 'PlantTreatment.saveBatch',
        msg: 'Database write conflict',
        details: { rowId: 'row-99' },
        statusCode: 409
      }),
      testError
    );
    expect(result.context).toBe('PlantTreatment.saveBatch');
  });

  it('should safely catch and ignore errors in the custom transport', () => {
    const failingTransport = vi.fn(() => {
      throw new Error('Transport socket down');
    });
    setErrorTransport(failingTransport);

    expect(() => {
      logError('DriverScan.sync', 'Sync timed out');
    }).not.toThrow();
  });

  it('should forward to window.Sentry if loaded and no custom transport is registered', () => {
    window.Sentry = {
      captureException: vi.fn()
    };

    const err = new Error('Barcode decoder overflow');
    logError('ScannerComponent', err);

    expect(window.Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(window.Sentry.captureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({
        tags: { context: 'ScannerComponent' }
      })
    );
  });
});
