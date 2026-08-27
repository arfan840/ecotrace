import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRoutes, fetchActiveRouteForDriver, startRoute, closeRoute, fetchManifests } from '../../lib/api/routes';

describe('Routes API Module', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = {};
    mockSupabase.from = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.select = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.insert = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.update = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.eq = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.order = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.limit = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.single = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.maybeSingle = vi.fn().mockReturnValue(mockSupabase);
  });

  describe('fetchRoutes', () => {
    it('should query routes with profiles join ordered by date descending', async () => {
      mockSupabase.then = vi.fn((cb) =>
        Promise.resolve(cb({
          data: [
            { id: 'r1', status: 'active', profiles: { name: 'Driver A' } },
            { id: 'r2', status: 'closed', profiles: { name: 'Driver B' } },
          ],
          error: null
        }))
      );

      const result = await fetchRoutes(mockSupabase, 'org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('routes');
      expect(mockSupabase.select).toHaveBeenCalledWith('*, profiles(name)');
      expect(mockSupabase.order).toHaveBeenCalledWith('date', { ascending: false });
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no routes exist', async () => {
      mockSupabase.then = vi.fn((cb) =>
        Promise.resolve(cb({ data: null, error: null }))
      );

      const result = await fetchRoutes(mockSupabase);
      expect(result).toEqual([]);
    });

    it('should throw on error', async () => {
      mockSupabase.then = vi.fn((cb) =>
        Promise.resolve(cb({ data: null, error: { message: 'timeout' } }))
      );

      await expect(fetchRoutes(mockSupabase)).rejects.toThrow('timeout');
    });
  });

  describe('fetchActiveRouteForDriver', () => {
    it('should query active route for specific driver with maybeSingle', async () => {
      mockSupabase.maybeSingle = vi.fn().mockReturnValue({
        then: vi.fn((cb) => Promise.resolve(cb({
          data: { id: 'r1', driver_id: 'd1', status: 'active' },
          error: null
        })))
      });

      const result = await fetchActiveRouteForDriver(mockSupabase, 'd1', 'org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('routes');
      expect(mockSupabase.eq).toHaveBeenCalledWith('driver_id', 'd1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabase.limit).toHaveBeenCalledWith(1);
      expect(result.status).toBe('active');
    });

    it('should return null when no active route exists', async () => {
      mockSupabase.maybeSingle = vi.fn().mockReturnValue({
        then: vi.fn((cb) => Promise.resolve(cb({
          data: null,
          error: null
        })))
      });

      const result = await fetchActiveRouteForDriver(mockSupabase, 'd1');
      expect(result).toBeNull();
    });
  });

  describe('startRoute', () => {
    it('should insert new active route with driver and vehicle details', async () => {
      mockSupabase.single = vi.fn().mockReturnValue({
        then: vi.fn((cb) => Promise.resolve(cb({
          data: { id: 'r-new', status: 'active', driver_id: 'd1' },
          error: null
        })))
      });

      const params = {
        driverId: 'd1',
        driverName: 'Test Driver',
        vehicleId: 'v1',
        vehicleNumber: 'JH-01-AB-1234',
      };

      const result = await startRoute(mockSupabase, params, 'org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('routes');
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        driver_id: 'd1',
        driver_name: 'Test Driver',
        vehicle_id: 'v1',
        vehicle_number: 'JH-01-AB-1234',
        status: 'active',
        organization_id: 'org-1',
      }));
      expect(result.status).toBe('active');
    });

    it('should throw on insert error', async () => {
      mockSupabase.single = vi.fn().mockReturnValue({
        then: vi.fn((cb) => Promise.resolve(cb({
          data: null,
          error: { message: 'driver already has active route' }
        })))
      });

      await expect(
        startRoute(mockSupabase, { driverId: 'd1', driverName: 'D', vehicleId: 'v1', vehicleNumber: 'X' })
      ).rejects.toThrow('driver already has active route');
    });
  });

  describe('closeRoute', () => {
    it('should update route status to closed', async () => {
      mockSupabase.single = vi.fn().mockReturnValue({
        then: vi.fn((cb) => Promise.resolve(cb({
          data: { id: 'r1', status: 'closed' },
          error: null
        })))
      });

      const result = await closeRoute(mockSupabase, 'r1', 'org-1');

      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'closed' });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'r1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(result.status).toBe('closed');
    });
  });

  describe('fetchManifests', () => {
    it('should query manifests by route_id', async () => {
      mockSupabase.then = vi.fn((cb) =>
        Promise.resolve(cb({
          data: [{ id: 'm1', route_id: 'r1' }],
          error: null
        }))
      );

      const result = await fetchManifests(mockSupabase, 'r1', 'org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('manifests');
      expect(mockSupabase.eq).toHaveBeenCalledWith('route_id', 'r1');
      expect(result).toHaveLength(1);
    });
  });
});
