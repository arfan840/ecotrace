import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  hospitalSchema,
  profileSchema,
  vehicleSchema,
  bagSchema,
  batchSchema,
  discrepancySchema
} from '../../lib/validation/schemas';

describe('Zod Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate valid login credentials', () => {
      const valid = { email: 'admin@ecotrace.com', password: 'password123' };
      const res = loginSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('should reject invalid email or short password', () => {
      expect(loginSchema.safeParse({ email: 'notanemail', password: '123' }).success).toBe(false);
      expect(loginSchema.safeParse({ email: 'user@test.com', password: '123' }).success).toBe(false);
    });
  });

  describe('hospitalSchema', () => {
    const validHospital = {
      name: 'City General Hospital',
      hcf_code: 'HCF0001',
      type: 'General',
      hospital_type: 'bedded',
      bedded: true,
      beds: '150',
      district: 'Dhanbad',
      state: 'JH',
      address: 'Main Road Sector 4',
      pincode: '826001',
      contact: '9876543210',
    };

    it('should validate complete hospital payload and transform string beds to number', () => {
      const res = hospitalSchema.safeParse(validHospital);
      expect(res.success).toBe(true);
      expect(res.data.beds).toBe(150);
    });

    it('should reject missing required fields or invalid HCF code format', () => {
      expect(hospitalSchema.safeParse({ ...validHospital, name: '' }).success).toBe(false);
      expect(hospitalSchema.safeParse({ ...validHospital, hcf_code: 'INVALID' }).success).toBe(false);
      expect(hospitalSchema.safeParse({ ...validHospital, district: 'D' }).success).toBe(false);
      expect(hospitalSchema.safeParse({ ...validHospital, contact: '123' }).success).toBe(false);
    });
  });

  describe('profileSchema', () => {
    const validProfile = {
      name: 'Driver John',
      email: 'john@driver.ecotrace.com',
      role: 'driver',
      phone: '9988776655',
    };

    it('should validate standard user profiles', () => {
      const res = profileSchema.safeParse(validProfile);
      expect(res.success).toBe(true);
    });

    it('should reject invalid role or invalid email', () => {
      expect(profileSchema.safeParse({ ...validProfile, role: 'superadmin' }).success).toBe(false);
      expect(profileSchema.safeParse({ ...validProfile, email: 'bad-email' }).success).toBe(false);
    });
  });

  describe('vehicleSchema', () => {
    const validVehicle = {
      number: 'JH-01-AB-1234',
      type: 'Van',
      status: 'active'
    };

    it('should validate vehicle configuration', () => {
      const res = vehicleSchema.safeParse(validVehicle);
      expect(res.success).toBe(true);
    });

    it('should reject short registration number or invalid status', () => {
      expect(vehicleSchema.safeParse({ ...validVehicle, number: '12' }).success).toBe(false);
      expect(vehicleSchema.safeParse({ ...validVehicle, status: 'broken' }).success).toBe(false);
    });
  });

  describe('bagSchema', () => {
    const validBag = {
      barcode: 'JH-DHN-GEN-2026-0001',
      hospital_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      hospital_name: 'City General',
      category: 'Yellow',
      weight: 3.45,
    };

    it('should validate correctly formatted waste bag metadata', () => {
      const res = bagSchema.safeParse(validBag);
      expect(res.success).toBe(true);
      expect(res.data.status).toBe('created');
    });

    it('should reject invalid categories or non-positive weights', () => {
      expect(bagSchema.safeParse({ ...validBag, category: 'Green' }).success).toBe(false);
      expect(bagSchema.safeParse({ ...validBag, weight: -2.5 }).success).toBe(false);
      expect(bagSchema.safeParse({ ...validBag, barcode: '123' }).success).toBe(false);
    });
  });

  describe('batchSchema and discrepancySchema', () => {
    it('should validate batch creation data', () => {
      const validBatch = {
        batch_number: 'BATCH-2026-01',
        bag_count: 5,
        total_weight: 15.2,
        treatment_type: 'Autoclave',
        operator: 'John Op'
      };
      const res = batchSchema.safeParse(validBatch);
      expect(res.success).toBe(true);
    });

    it('should validate discrepancy records', () => {
      const validDiscrepancy = {
        bag_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        barcode: 'B001',
        type: 'weight_mismatch',
        description: 'Recorded 3kg vs 5kg received'
      };
      const res = discrepancySchema.safeParse(validDiscrepancy);
      expect(res.success).toBe(true);
    });
  });
});
