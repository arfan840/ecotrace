import { describe, it, expect, vi } from 'vitest';
import { logError, AppError } from '../../lib/errors';

describe('Error Handling Integration', () => {
  it('should capture and format error with context using logError', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const sampleError = new Error('Network query timed out');

    const msg = logError('AdminBags.loadBags', sampleError);

    expect(msg).toContain('[Context: AdminBags.loadBags]');
    expect(msg).toContain('Message: Network query timed out');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Context: AdminBags.loadBags]'),
      expect.objectContaining({ stack: expect.any(String), context: {} })
    );

    errorSpy.mockRestore();
  });

  it('should format AppError instances correctly with status codes and details', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const appErr = new AppError('Resource not found', { id: 'bag-123' }, 404);

    const msg = logError('PlantGateScan.processCode', appErr);

    expect(msg).toContain('[Context: PlantGateScan.processCode]');
    expect(msg).toContain('Message: Resource not found');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Context: PlantGateScan.processCode]'),
      expect.objectContaining({ context: { id: 'bag-123' } })
    );

    expect(appErr.statusCode).toBe(404);
    expect(appErr.context).toEqual({ id: 'bag-123' });

    errorSpy.mockRestore();
  });
});
