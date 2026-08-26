import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const hospitalSchema = z.object({
  name: z.string().min(2, { message: 'Facility name is required' }),
  hcf_code: z.string().regex(/^HCF\d{3,6}$/i, { message: 'Code must match HCF0001 format' }),
  type: z.enum(['General', 'Private', 'Clinic', 'PHC', 'CHC', 'Lab', 'Nursing Home', 'Dental', 'Eye Hospital', 'Other']),
  hospital_type: z.enum(['bedded', 'non_bedded']),
  bedded: z.boolean().default(true),
  beds: z.union([z.number().int().nonnegative(), z.null(), z.string().transform(val => val === '' ? null : Number(val))]).optional(),
  district: z.string().min(2, { message: 'District is required' }),
  state: z.string().length(2).default('JH'),
  address: z.string().min(5, { message: 'Address is required' }),
  pincode: z.string().regex(/^\d{6}$/, { message: 'Pincode must be 6 digits' }).optional().or(z.literal('')),
  contact: z.string().min(10, { message: 'Contact must be at least 10 digits' }),
});

export const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  role: z.enum(['plant_head', 'plant_manager', 'driver', 'regulatory', 'hcf']),
  phone: z.string().optional().or(z.literal('')),
  hospital_id: z.string().uuid().nullable().optional(),
});

export const vehicleSchema = z.object({
  number: z.string().min(4, { message: 'Registration number is required' }),
  type: z.string().default('Van'),
  driver_id: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'maintenance', 'inactive']).default('active'),
});

export const bagSchema = z.object({
  barcode: z.string().min(5, { message: 'Bag barcode is required' }),
  hospital_id: z.string().uuid({ message: 'Valid Hospital/HCF link required' }),
  hospital_name: z.string().min(1),
  hcf_code: z.string().optional(),
  district: z.string().optional(),
  state: z.string().length(2).default('JH'),
  category: z.enum(['Yellow', 'Red', 'Blue', 'White']),
  weight: z.number().positive({ message: 'Weight must be greater than 0' }).optional().nullable(),
  status: z.enum(['created', 'collected', 'received', 'in_batch', 'treated']).default('created'),
});

export const batchSchema = z.object({
  batch_number: z.string().min(3),
  bag_count: z.number().int().nonnegative(),
  total_weight: z.number().nonnegative(),
  treatment_type: z.string().optional(),
  operator: z.string().optional(),
});

export const discrepancySchema = z.object({
  bag_id: z.string().uuid(),
  barcode: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  route_id: z.string().uuid().optional().nullable(),
});
