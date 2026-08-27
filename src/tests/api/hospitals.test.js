import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchHospitals, createHospital, updateHospital, deleteHospital } from '../../lib/api/hospitals';

describe('Hospitals API Module', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = {};
    mockSupabase.from = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.select = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.insert = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.update = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.delete = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.eq = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.order = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.single = vi.fn().mockReturnValue(mockSupabase);
  });

  describe('fetchHospitals', () => {
    it('should query hospitals ordered by name and return data', async () => {
      mockSupabase.then = vi.fn((cb) =>
        Promise.resolve(cb({
          data: [{ id: 'h1', name: 'City Hospital' }, { id: 'h2', name: 'Rural PHC' }],
          error: null
        }))
      );

      const result = await fetchHospitals(mockSupabase, 'org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('hospitals');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.order).toHaveBeenCalledWith('name');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('City Hospital');
    });

    it('should return empty array when data is null', async () => {
      mockSupabase.then = vi.fn((cb) =>
        Promise.resolve(cb({ data: null, error: null }))
      );

      const result = await fetchHospitals(mockSupabase);
      expect(result).toEqual([]);
    });

    it('should throw on database error', async () => {
      mockSupabase.then = vi.fn((cb) =>
        Promise.resolve(cb({ data: null, error: { message: 'connection refused' } }))
      );

      await expect(fetchHospitals(mockSupabase)).rejects.toThrow('connection refused');
    });
  });

  describe('createHospital', () => {
    it('should insert hospital with computed bedded and beds fields', async () => {
      mockSupabase.single = vi.fn().mockReturnValue({
        then: vi.fn((cb) => Promise.resolve(cb({
          data: { id: 'h-new', name: 'Test Clinic', bedded: false, beds: null },
          error: null
        })))
      });

      const input = {
        name: 'Test Clinic',
        hospital_type: 'non_bedded',
        beds: '',
      };

      const result = await createHospital(mockSupabase, input, 'org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('hospitals');
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Clinic',
        organization_id: 'org-1',
        bedded: false,
        beds: null,
      }));
      expect(result.id).toBe('h-new');
    });

    it('should compute bedded=true for bedded hospital_type', async () => {
      mockSupabase.single = vi.fn().mockReturnValue({
        then: vi.fn((cb) => Promise.resolve(cb({
          data: { id: 'h-bed', bedded: true, beds: 50 },
          error: null
        })))
      });

      await createHospital(mockSupabase, {
        name: 'General',
        hospital_type: 'bedded',
        beds: '50',
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        bedded: true,
        beds: 50,
      }));
    });

    it('should throw on insert error', async () => {
      mockSupabase.single = vi.fn().mockReturnValue({
        then: vi.fn((cb) => Promise.resolve(cb({
          data: null,
          error: { message: 'duplicate key' }
        })))
      });

      await expect(
        createHospital(mockSupabase, { name: 'Dup', hospital_type: 'bedded' })
      ).rejects.toThrow('duplicate key');
    });
  });

  describe('updateHospital', () => {
    it('should update hospital by id with org filter', async () => {
      mockSupabase.single = vi.fn().mockReturnValue({
        then: vi.fn((cb) => Promise.resolve(cb({
          data: { id: 'h1', name: 'Updated' },
          error: null
        })))
      });

      const result = await updateHospital(mockSupabase, 'h1', {
        name: 'Updated',
        hospital_type: 'bedded',
        beds: '30',
      }, 'org-1');

      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Updated',
        bedded: true,
        beds: 30,
      }));
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'h1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(result.name).toBe('Updated');
    });
  });

  describe('deleteHospital', () => {
    it('should delete hospital by id and return true', async () => {
      mockSupabase.then = vi.fn((cb) =>
        Promise.resolve(cb({ error: null }))
      );

      const result = await deleteHospital(mockSupabase, 'h1', 'org-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('hospitals');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'h1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(result).toBe(true);
    });

    it('should throw on delete error', async () => {
      mockSupabase.then = vi.fn((cb) =>
        Promise.resolve(cb({ error: { message: 'foreign key constraint' } }))
      );

      await expect(
        deleteHospital(mockSupabase, 'h1')
      ).rejects.toThrow('foreign key constraint');
    });
  });
});
