import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchHospitals, createHospital } from '../../lib/api/hospitals';
import { fetchRoutes, startRoute, closeRoute } from '../../lib/api/routes';
import { createBags, lookupBagByBarcode, updateBagStatus } from '../../lib/api/bags';
import { fetchBatches, createBatch, treatBatch } from '../../lib/api/batches';

describe('Data Layer Smoke & Integration Contract Suite', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis()
    };
  });

  it('verifies end-to-end hospital creation and retrieval contract', async () => {
    // 1. Create hospital
    mockClient.single.mockReturnValue({
      then: vi.fn(cb => Promise.resolve(cb({
        data: { id: 'hosp-101', name: 'Apex Hospital', code: 'HCF0001', beds: 45 },
        error: null
      })))
    });

    const created = await createHospital(mockClient, {
      name: 'Apex Hospital',
      code: 'HCF0001',
      beds: 45
    }, 'org-1');

    expect(created.id).toBe('hosp-101');
    expect(created.name).toBe('Apex Hospital');

    // 2. Fetch hospitals
    mockClient.then = vi.fn(cb => Promise.resolve(cb({
      data: [{ id: 'hosp-101', name: 'Apex Hospital' }],
      error: null
    })));

    const list = await fetchHospitals(mockClient, 'org-1');
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Apex Hospital');
  });

  it('verifies transport route lifecycle contract (start -> fetch -> close)', async () => {
    // 1. Start route
    mockClient.single.mockReturnValueOnce({
      then: vi.fn(cb => Promise.resolve(cb({
        data: { id: 'route-501', status: 'active', vehicle_number: 'JH01-9999' },
        error: null
      })))
    });

    const route = await startRoute(mockClient, {
      driverId: 'driver-1',
      driverName: 'Driver Dan',
      vehicleId: 'v-1',
      vehicleNumber: 'JH01-9999'
    }, 'org-1');

    expect(route.status).toBe('active');

    // 2. Fetch routes
    mockClient.then = vi.fn(cb => Promise.resolve(cb({
      data: [route],
      error: null
    })));

    const routes = await fetchRoutes(mockClient, 'org-1');
    expect(routes).toHaveLength(1);

    // 3. Close route
    mockClient.single.mockReturnValueOnce({
      then: vi.fn(cb => Promise.resolve(cb({
        data: { id: 'route-501', status: 'closed' },
        error: null
      })))
    });

    const closed = await closeRoute(mockClient, 'route-501', 'org-1');
    expect(closed.status).toBe('closed');
  });

  it('verifies bag creation, barcode lookup, and status update contract', async () => {
    // 1. Create bags
    mockClient.then = vi.fn(cb => Promise.resolve(cb({
      data: [{ id: 'b-1', barcode: 'JH-DHA-HCF0001-Y-20260830-000001', status: 'created' }],
      error: null
    })));

    const bags = await createBags(mockClient, [{ barcode: 'JH-DHA-HCF0001-Y-20260830-000001' }], 'org-1');
    expect(bags).toHaveLength(1);

    // 2. Lookup bag
    mockClient.maybeSingle.mockReturnValueOnce({
      then: vi.fn(cb => Promise.resolve(cb({
        data: { id: 'b-1', barcode: 'JH-DHA-HCF0001-Y-20260830-000001', status: 'created' },
        error: null
      })))
    });

    const found = await lookupBagByBarcode(mockClient, 'JH-DHA-HCF0001-Y-20260830-000001', 'org-1');
    expect(found.id).toBe('b-1');

    // 3. Update status
    mockClient.single.mockReturnValueOnce({
      then: vi.fn(cb => Promise.resolve(cb({
        data: { id: 'b-1', status: 'collected' },
        error: null
      })))
    });

    const updated = await updateBagStatus(mockClient, 'b-1', 'collected', {}, 'org-1');
    expect(updated.status).toBe('collected');
  });

  it('verifies batch waste treatment lifecycle contract', async () => {
    // 1. Create batch
    mockClient.single.mockReturnValueOnce({
      then: vi.fn(cb => Promise.resolve(cb({
        data: { id: 'batch-77', batch_number: 'B-2026-08-30-001', status: 'created', bag_count: 5 },
        error: null
      })))
    });

    const newBatch = await createBatch(mockClient, {
      batch_number: 'B-2026-08-30-001',
      treatment_type: 'Autoclave',
      bag_count: 5,
      total_weight: 18.5
    }, 'org-1');

    expect(newBatch.id).toBe('batch-77');

    // 2. Fetch batches
    mockClient.then = vi.fn(cb => Promise.resolve(cb({
      data: [newBatch],
      error: null
    })));

    const batches = await fetchBatches(mockClient, 'org-1');
    expect(batches).toHaveLength(1);

    // 3. Treat batch
    mockClient.single.mockReturnValueOnce({
      then: vi.fn(cb => Promise.resolve(cb({
        data: { id: 'batch-77', status: 'treated', treated_at: new Date().toISOString() },
        error: null
      })))
    });

    const treated = await treatBatch(mockClient, 'batch-77', { operator: 'Op Alice' }, 'org-1');
    expect(treated.status).toBe('treated');
  });
});
