import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queueAction, getQueue, clearQueue, syncQueue } from '../../lib/offlineQueue';
import * as bagsApi from '../../lib/api/bags';
import * as auditApi from '../../lib/api/auditLogs';

describe('Offline Synchronization Queue Module', () => {
  const mockSupabase = {};

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(bagsApi, 'updateBagStatus').mockResolvedValue({ id: 'bag-1' });
    vi.spyOn(auditApi, 'insertAuditLog').mockResolvedValue({ id: 'audit-1' });
  });

  it('queues actions in localStorage and retrieves them', () => {
    expect(getQueue()).toEqual([]);

    queueAction('GPS_CHECKIN', { userId: 'u1', userName: 'Driver Dan', lat: 23.79, lng: 86.43 });
    const queue = getQueue();

    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('GPS_CHECKIN');
    expect(queue[0].payload.lat).toBe(23.79);
    expect(queue[0].id).toBeDefined();
  });

  it('clears all queued actions', () => {
    queueAction('GPS_CHECKIN', { userId: 'u1' });
    expect(getQueue()).toHaveLength(1);

    clearQueue();
    expect(getQueue()).toHaveLength(0);
  });

  it('synchronizes GPS checkin actions', async () => {
    queueAction('GPS_CHECKIN', {
      userId: 'u1',
      userName: 'Driver Dan',
      lat: 23.795432,
      lng: 86.432109
    });

    const synced = await syncQueue(mockSupabase, 'org-1');
    expect(synced).toBe(1);
    expect(getQueue()).toHaveLength(0);

    expect(auditApi.insertAuditLog).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({
        action: 'DRIVER_CHECKIN',
        entity: 'CHECKIN',
        details: expect.stringContaining('23.795432, 86.432109')
      }),
      'org-1'
    );
  });

  it('synchronizes collected bags with weights and GPS', async () => {
    queueAction('BAG_COLLECTED', {
      bagId: 'bag-99',
      barcode: 'JH-DHA-HCF0001-Y-20260830-000001',
      weight: '4.5',
      userId: 'driver-1',
      userName: 'Dave',
      routeId: 'route-1',
      gps: { lat: 23.79, lng: 86.43 }
    });

    const synced = await syncQueue(mockSupabase, 'org-1');
    expect(synced).toBe(1);
    expect(getQueue()).toHaveLength(0);

    expect(bagsApi.updateBagStatus).toHaveBeenCalledWith(
      mockSupabase,
      'bag-99',
      'collected',
      expect.objectContaining({
        weight: 4.5,
        route_id: 'route-1'
      }),
      'org-1'
    );
  });

  it('keeps failed items in queue for future retry', async () => {
    queueAction('BAG_COLLECTED', {
      bagId: 'bag-failing',
      barcode: 'JH-FAIL',
      weight: '2.0',
      userId: 'driver-1'
    });

    vi.spyOn(bagsApi, 'updateBagStatus').mockRejectedValueOnce(new Error('Network failure'));

    const synced = await syncQueue(mockSupabase, 'org-1');
    expect(synced).toBe(0);
    expect(getQueue()).toHaveLength(1);
    expect(getQueue()[0].payload.bagId).toBe('bag-failing');
  });
});
