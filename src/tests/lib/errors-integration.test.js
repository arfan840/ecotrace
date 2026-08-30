import { describe, it, expect, vi } from 'vitest';
import { logError, AppError } from '../../lib/errors';

describe('Error Handling Integration', () => {
  it('should capture and format error with context using logError', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const sampleError = new Error('Network query timed out');

    const logObj = logError('AdminBags.loadBags', sampleError);

    expect(logObj.context).toBe('AdminBags.loadBags');
    expect(logObj.msg).toBe('Network query timed out');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"context":"AdminBags.loadBags"')
    );

    errorSpy.mockRestore();
  });

  it('should format AppError instances correctly with status codes and details', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const appErr = new AppError('Resource not found', { id: 'bag-123' }, 404);

    const logObj = logError('PlantGateScan.processCode', appErr);

    expect(logObj.context).toBe('PlantGateScan.processCode');
    expect(logObj.msg).toBe('Resource not found');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"context":"PlantGateScan.processCode"')
    );

    expect(appErr.statusCode).toBe(404);
    expect(appErr.context).toEqual({ id: 'bag-123' });

    errorSpy.mockRestore();
  });
});
