import { describe, it, expect, vi } from 'vitest';
import { districtCode, parseBagId, generateBagIds } from '../lib/bagId';
import { parseQRPayload } from '../lib/qrGenerator';
import { generateCertificateHTML } from '../lib/certificate';
import { canPerform } from '../lib/auth/permissions';
import { loginSchema, hospitalSchema, profileSchema } from '../lib/validation/schemas';
import { isStaffOnlyScanRequired } from '../lib/business/dispatchRules';


// DistrictCode isn't exported directly but we can test it through bagId functions or mock dates.
describe('Bag ID Generation and Parsing', () => {
  it('should correctly parse a well-formed Bag ID', () => {
    const bagId = 'JH-DHA-HCF0001-Y-20250509-000001';
    const parsed = parseBagId(bagId);
    expect(parsed).toEqual({
      state: 'JH',
      district: 'DHA',
      hcfCode: 'HCF0001',
      category: 'Yellow',
      date: '20250509',
      sequence: '000001',
    });
  });

  it('should return null for malformed Bag IDs', () => {
    expect(parseBagId('malformed-id')).toBeNull();
    expect(parseBagId('')).toBeNull();
  });

  it('should generate next sequences using mocked Supabase', async () => {
    const mockSupabase = {};
    mockSupabase.from = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.select = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.eq = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.single = vi.fn().mockResolvedValue({
      data: { id: 'seq-123', seq: 5 },
      error: null,
    });
    mockSupabase.insert = vi.fn().mockReturnValue(mockSupabase);
    mockSupabase.update = vi.fn().mockReturnValue(mockSupabase);
    
    const mockHospital = {
      id: 'hosp-123',
      hcf_code: 'HCF0001',
      district: 'Dhanbad',
      state: 'JH',
    };
    
    const bagIds = await generateBagIds(mockSupabase, mockHospital, 'Yellow', 2);
    expect(bagIds).toHaveLength(2);
    expect(bagIds[0]).toContain('JH-DHA-HCF0001-Y-');
    expect(bagIds[1]).toContain('JH-DHA-HCF0001-Y-');
  });
});

describe('QR Code Processing', () => {
  it('should parse JSON-encoded QR payloads', () => {
    const raw = JSON.stringify({ bag_id: 'JH-DHA-HCF0001-Y-20250509-000001' });
    const parsed = parseQRPayload(raw);
    expect(parsed).toBe('JH-DHA-HCF0001-Y-20250509-000001');
  });

  it('should fall back to raw string if it looks like a barcode', () => {
    const raw = 'JH-DHA-HCF0001-Y-20250509-000001';
    const parsed = parseQRPayload(raw);
    expect(parsed).toBe('JH-DHA-HCF0001-Y-20250509-000001');
  });

  it('should return null for invalid payloads', () => {
    expect(parseQRPayload('randomstring')).toBeNull();
  });
});

describe('Permission Check Engine', () => {
  it('should allow plant_head to manage hospitals and view audit logs', () => {
    expect(canPerform('plant_head', 'hospitals', 'create')).toBe(true);
    expect(canPerform('plant_head', 'audit_logs', 'view')).toBe(true);
  });

  it('should restrict driver from deleting hospitals or managing users', () => {
    expect(canPerform('driver', 'hospitals', 'delete')).toBe(false);
    expect(canPerform('driver', 'users', 'manage')).toBe(false);
  });

  it('should restrict regulatory to read-only views', () => {
    expect(canPerform('regulatory', 'bags', 'view')).toBe(true);
    expect(canPerform('regulatory', 'bags', 'edit')).toBe(false);
  });

  it('should allow HCF users to view own certificates', () => {
    expect(canPerform('hcf', 'certificates', 'view')).toBe(true);
    expect(canPerform('hcf', 'vehicles', 'view')).toBe(false);
  });
});

describe('Zod Schema Inputs Validation', () => {
  describe('loginSchema', () => {
    it('should validate correct credentials', () => {
      const res = loginSchema.safeParse({ email: 'driver@ecotrace.in', password: 'password123' });
      expect(res.success).toBe(true);
    });

    it('should fail on invalid email format', () => {
      const res = loginSchema.safeParse({ email: 'notanemail', password: 'password123' });
      expect(res.success).toBe(false);
    });

    it('should fail on too short password', () => {
      const res = loginSchema.safeParse({ email: 'driver@ecotrace.in', password: '123' });
      expect(res.success).toBe(false);
    });
  });

  describe('hospitalSchema', () => {
    it('should validate correct facility data', () => {
      const hcf = {
        name: 'City Clinic',
        hcf_code: 'HCF0002',
        type: 'Clinic',
        hospital_type: 'non_bedded',
        bedded: false,
        beds: 0,
        district: 'Ranchi',
        state: 'JH',
        address: '123 Main Road, Ranchi',
        pincode: '834001',
        contact: '9876543210',
      };
      const res = hospitalSchema.safeParse(hcf);
      expect(res.success).toBe(true);
    });

    it('should fail when missing required contact field', () => {
      const hcf = {
        name: 'City Clinic',
        hcf_code: 'HCF0002',
        type: 'Clinic',
        hospital_type: 'non_bedded',
        bedded: false,
        district: 'Ranchi',
        state: 'JH',
        address: '123 Main Road, Ranchi',
        contact: '',
      };
      const res = hospitalSchema.safeParse(hcf);
      expect(res.success).toBe(false);
    });
  });
});

describe('Disposal Certificate Formatting', () => {
  it('should generate printable HTML with correct batch info', () => {
    const mockBatch = {
      id: 'batch-1234-abcd',
      batch_number: 'B-2026-08-01',
      treatment_type: 'Autoclave',
      bag_count: 12,
      total_weight: 45.5,
      treated_at: '2026-08-26T12:00:00Z',
      operator: 'Mock Operator',
    };
    const html = generateCertificateHTML(mockBatch, 'Mock Operator');
    expect(html).toContain('B-2026-08-01');
    expect(html).toContain('Autoclave');
    expect(html).toContain('45.50 kg');
    expect(html).toContain('Mock Operator');
    expect(html).toContain('Disposal Certificate');
  });

  it('should generate printable HTML with camelCase columns and category breakdown', () => {
    const mockBatch = {
      id: 'batch-1234-abcd',
      batchNumber: 'B-2026-08-02',
      treatmentType: 'Incineration',
      bagCount: 20,
      totalWeight: 50.1,
      treatedAt: '2026-08-26T12:00:00Z',
    };
    const breakdown = {
      Yellow: { count: 10, weight: 25.5 },
      Red: { count: 5, weight: 12.3 },
      White: { count: 3, weight: 6.2 },
      Blue: { count: 2, weight: 6.1 }
    };
    const html = generateCertificateHTML(mockBatch, '', breakdown);
    expect(html).toContain('B-2026-08-02');
    expect(html).toContain('Incineration');
    expect(html).toContain('50.10 kg');
    expect(html).toContain('System Operator');
    expect(html).toContain('10');
    expect(html).toContain('25.50 kg');
  });

  it('should fallback to defaults when properties are missing', () => {
    const html = generateCertificateHTML({});
    expect(html).toContain('—');
    expect(html).toContain('Autoclave');
    expect(html).toContain('0.00 kg');
    expect(html).toContain('System Operator');
  });
});

describe('Facility Dispatch Rules', () => {
  it('should require staff-only scan for HCFs with >30 beds', () => {
    expect(isStaffOnlyScanRequired({ name: 'Big Hospital', beds: 31 })).toBe(true);
    expect(isStaffOnlyScanRequired({ name: 'Limit Hospital', beds: 30 })).toBe(false);
    expect(isStaffOnlyScanRequired({ name: 'Small Clinic', beds: 5 })).toBe(false);
  });

  it('should handle missing or malformed bed inputs safely', () => {
    expect(isStaffOnlyScanRequired(null)).toBe(false);
    expect(isStaffOnlyScanRequired({})).toBe(false);
    expect(isStaffOnlyScanRequired({ beds: 'invalid' })).toBe(false);
  });
});

