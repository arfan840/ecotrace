import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchFilteredBags, createBags, lookupBagByBarcode } from '../../lib/api/bags';

describe('Bags API Module', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = {};
    mockSupabase.from = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.select = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.insert = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.update = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.eq = vi.fn().mockReturnValue(mockSupabase);
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
});
