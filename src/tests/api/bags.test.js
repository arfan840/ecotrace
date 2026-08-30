import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchFilteredBags, createBags, lookupBagByBarcode, insertScanEvent, updateBagStatus, fetchBagsByRoute, fetchBagsByBatch, fetchBagsByStatus, linkBagsToBatch } from '../../lib/api/bags';

describe('Bags API Module', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = {};
    mockSupabase.from = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.select = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.insert = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.update = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.eq = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.in = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.or = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.range = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.order = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.single = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.maybeSingle = vi.fn().mockReturnValue(mockSupabase);
  });

  describe('fetchFilteredBags', () => {
    it('should query bags with proper pagination range and filters', async () => {
      // Mock count structure
      mockSupabase.then = vi.fn((callback) => {
        return Promise.resolve(callback({
          data: [{ id: '1', barcode: 'B1' }, { id: '2', barcode: 'B2' }],
          error: null,
          count: 10
        }));
      });

      const result = await fetchFilteredBags(mockSupabase, 'org-123', {
        status: 'collected',
        category: 'Yellow',
        search: 'B1',
        page: 1,
        limit: 2
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('bags');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org-123');
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'collected');
      expect(mockSupabase.eq).toHaveBeenCalledWith('category', 'Yellow');
      expect(result.bags).toHaveLength(2);
      expect(result.total).toBe(10);
    });

    it('should throw an error if the database query fails', async () => {
      mockSupabase.then = vi.fn((callback) => {
        return Promise.resolve(callback({
          data: null,
          error: new Error('QueryTimeout'),
          count: 0
        }));
      });

      await expect(
        fetchFilteredBags(mockSupabase, 'org-123', {})
      ).rejects.toThrow('QueryTimeout');
    });
  });

  describe('createBags', () => {
    it('should batch insert bags with organization_id set', async () => {
      const mockBags = [
        { barcode: 'B1', category: 'Yellow' },
        { barcode: 'B2', category: 'Red' }
      ];

      mockSupabase.then = vi.fn((callback) => {
        return Promise.resolve(callback({
          data: [
            { id: '1', barcode: 'B1', organization_id: 'org-123' },
            { id: '2', barcode: 'B2', organization_id: 'org-123' }
          ],
          error: null
        }));
      });

      const result = await createBags(mockSupabase, mockBags, 'org-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('bags');
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        { barcode: 'B1', category: 'Yellow', organization_id: 'org-123', status: 'created' },
        { barcode: 'B2', category: 'Red', organization_id: 'org-123', status: 'created' }
      ]);
      expect(result).toHaveLength(2);
    });

    it('should throw an error if insert fails', async () => {
      mockSupabase.then = vi.fn((callback) => {
        return Promise.resolve(callback({
          data: null,
          error: new Error('Duplicate Key Violates Unique Constraint')
        }));
      });

      await expect(
        createBags(mockSupabase, [{ barcode: 'B1' }], 'org-123')
      ).rejects.toThrow('Duplicate Key Violates Unique Constraint');
    });
  });

  describe('lookupBagByBarcode', () => {
    it('should locate a single bag including hospital details', async () => {
      mockSupabase.then = vi.fn((callback) => {
        return Promise.resolve(callback({
          data: { id: 'bag-1', barcode: 'B1', hospital_name: 'City Hosp' },
          error: null
        }));
      });

      const result = await lookupBagByBarcode(mockSupabase, 'B1', 'org-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('bags');
      expect(mockSupabase.select).toHaveBeenCalledWith('*, hospitals(name, beds, district)');
      expect(mockSupabase.eq).toHaveBeenCalledWith('barcode', 'B1');
      expect(result.hospital_name).toBe('City Hosp');
    });
  });

  describe('insertScanEvent', () => {
    it('should insert a scan event with bag_id, barcode, and scan_type', async () => {
      mockSupabase.single = vi.fn().mockReturnValue({
        then: vi.fn((cb) => Promise.resolve(cb({
          data: { id: 'se-1', bag_id: 'b1', barcode: 'B001', scan_type: 'collection' },
          error: null
        })))
      });

      const eventData = {
        bag_id: 'b1',
        barcode: 'B001',
        scanned_by: 'u1',
        scanner_name: 'Driver A',
        scan_type: 'collection',
        weight: 2.5,
        gps_lat: 23.79,
        gps_lng: 86.43,
      };

      const result = await insertScanEvent(mockSupabase, eventData);

      expect(mockSupabase.from).toHaveBeenCalledWith('scan_events');
      expect(mockSupabase.insert).toHaveBeenCalledWith(eventData);
      expect(result.scan_type).toBe('collection');
    });

    it('should throw on insert error', async () => {
      mockSupabase.single = vi.fn().mockReturnValue({
        then: vi.fn((cb) => Promise.resolve(cb({
          data: null,
          error: { message: 'RLS policy violation' }
        })))
      });

      await expect(
        insertScanEvent(mockSupabase, { bag_id: 'b1' })
      ).rejects.toThrow('RLS policy violation');
    });
  });

  describe('updateBagStatus', () => {
    it('should update bag status correctly', async () => {
      mockSupabase.single = vi.fn().mockReturnValue({
        then: vi.fn((cb) => Promise.resolve(cb({
          data: { id: 'bag1', status: 'collected' },
          error: null
        })))
      });

      const res = await updateBagStatus(mockSupabase, 'bag1', 'collected', { weight: 5.5 }, 'org1');
      expect(mockSupabase.from).toHaveBeenCalledWith('bags');
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'collected', weight: 5.5 });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'bag1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org1');
      expect(res.status).toBe('collected');
    });
  });

  describe('fetchBagsByRoute', () => {
    it('should fetch bags matching route id', async () => {
      mockSupabase.then = vi.fn((cb) => Promise.resolve(cb({
        data: [{ id: 'bag1', route_id: 'route1' }],
        error: null
      })));

      const res = await fetchBagsByRoute(mockSupabase, 'route1', 'org1');
      expect(mockSupabase.from).toHaveBeenCalledWith('bags');
      expect(mockSupabase.eq).toHaveBeenCalledWith('route_id', 'route1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org1');
      expect(res).toHaveLength(1);
    });
  });

  describe('fetchBagsByBatch', () => {
    it('should fetch bags matching batch id', async () => {
      mockSupabase.then = vi.fn((cb) => Promise.resolve(cb({
        data: [{ id: 'bag1', batch_id: 'batch1' }],
        error: null
      })));

      const res = await fetchBagsByBatch(mockSupabase, 'batch1', 'org1');
      expect(mockSupabase.from).toHaveBeenCalledWith('bags');
      expect(mockSupabase.eq).toHaveBeenCalledWith('batch_id', 'batch1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org1');
      expect(res).toHaveLength(1);
    });
  });

  describe('fetchBagsByStatus', () => {
    it('should fetch bags matching status', async () => {
      mockSupabase.then = vi.fn((cb) => Promise.resolve(cb({
        data: [{ id: 'bag1', status: 'received' }],
        error: null
      })));

      const res = await fetchBagsByStatus(mockSupabase, 'received', 'org1');
      expect(mockSupabase.from).toHaveBeenCalledWith('bags');
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'received');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org1');
      expect(res).toHaveLength(1);
    });
  });

  describe('linkBagsToBatch', () => {
    it('should link selected bags to a batch and update status', async () => {
      mockSupabase.then = vi.fn((cb) => Promise.resolve(cb({
        data: [{ id: 'bag1', status: 'in_batch', batch_id: 'batch1' }],
        error: null
      })));

      const res = await linkBagsToBatch(mockSupabase, ['bag1'], 'batch1', 'org1');
      expect(mockSupabase.from).toHaveBeenCalledWith('bags');
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'in_batch', batch_id: 'batch1' });
      expect(mockSupabase.in).toHaveBeenCalledWith('id', ['bag1']);
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org1');
      expect(res).toHaveLength(1);
    });
  });
});
