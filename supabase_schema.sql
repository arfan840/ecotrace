-- ==========================================
-- EcoTrace Supabase Schema (Multi-Tenant SaaS Enabled)
-- Run this in Supabase SQL Editor
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Default Organization ID to preserve existing data and default tenancy
-- Default UUID: 'd3b07384-d113-495f-a5d6-84cdca334237'

-- ==========================================
-- 1. HOSPITALS / HCFs
-- ==========================================
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL DEFAULT 'd3b07384-d113-495f-a5d6-84cdca334237'::uuid,
  name TEXT NOT NULL,
  hcf_code TEXT UNIQUE,             -- e.g. HCF0001 used in bag ID
  type TEXT NOT NULL,               -- General, Private, Clinic, PHC, CHC etc.
  hospital_type TEXT,               -- bedded / non_bedded
  bedded BOOLEAN DEFAULT true,
  beds INTEGER,
  district TEXT NOT NULL,
  state TEXT DEFAULT 'JH',
  address TEXT NOT NULL,
  pincode TEXT,
  contact TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. PROFILES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  organization_id UUID NOT NULL DEFAULT 'd3b07384-d113-495f-a5d6-84cdca334237'::uuid,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('plant_head', 'plant_manager', 'driver', 'regulatory', 'hcf')),
  phone TEXT,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. VEHICLES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL DEFAULT 'd3b07384-d113-495f-a5d6-84cdca334237'::uuid,
  number TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'Van',
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. ROUTES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL DEFAULT 'd3b07384-d113-495f-a5d6-84cdca334237'::uuid,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  driver_name TEXT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  vehicle_number TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. BAG SEQUENCE (for unique bag IDs)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.bag_sequence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL DEFAULT 'd3b07384-d113-495f-a5d6-84cdca334237'::uuid,
  hcf_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  date_str TEXT NOT NULL,           -- YYYYMMDD
  seq INTEGER DEFAULT 0,
  UNIQUE(hcf_id, date_str)
);

-- ==========================================
-- 6. BATCHES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL DEFAULT 'd3b07384-d113-495f-a5d6-84cdca334237'::uuid,
  batch_number TEXT UNIQUE NOT NULL,
  bag_count INTEGER DEFAULT 0,
  total_weight NUMERIC(10, 2) DEFAULT 0,
  treatment_type TEXT,
  operator TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  treated_at TIMESTAMPTZ
);

-- ==========================================
-- 7. BAGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.bags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL DEFAULT 'd3b07384-d113-495f-a5d6-84cdca334237'::uuid,
  barcode TEXT UNIQUE NOT NULL,     -- The bag_id string e.g. JH-DGH-HCF0001-Y-20250509-000001
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  hospital_name TEXT NOT NULL,
  hcf_code TEXT,
  district TEXT,
  state TEXT DEFAULT 'JH',
  category TEXT NOT NULL CHECK (category IN ('Yellow', 'Red', 'Blue', 'White')),
  weight NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'created',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  collected_at TIMESTAMPTZ,
  collected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ,
  received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  gps_lat NUMERIC(10, 6),
  gps_lng NUMERIC(10, 6),
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL
);

-- ==========================================
-- 8. SCAN EVENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.scan_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL DEFAULT 'd3b07384-d113-495f-a5d6-84cdca334237'::uuid,
  bag_id UUID REFERENCES public.bags(id) ON DELETE CASCADE,
  barcode TEXT,
  scanned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  scanner_name TEXT,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('collection', 'gate_in', 'treatment', 'audit')),
  weight NUMERIC(10, 2),
  gps_lat NUMERIC(10, 6),
  gps_lng NUMERIC(10, 6),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 9. MANIFESTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.manifests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL DEFAULT 'd3b07384-d113-495f-a5d6-84cdca334237'::uuid,
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  hospital_name TEXT,
  bag_count INTEGER DEFAULT 0,
  yellow_count INTEGER DEFAULT 0,
  red_count INTEGER DEFAULT 0,
  blue_count INTEGER DEFAULT 0,
  white_count INTEGER DEFAULT 0,
  total_weight NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- ==========================================
-- 10. DISCREPANCIES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.discrepancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL DEFAULT 'd3b07384-d113-495f-a5d6-84cdca334237'::uuid,
  bag_id UUID REFERENCES public.bags(id) ON DELETE CASCADE,
  barcode TEXT,
  type TEXT NOT NULL,
  description TEXT,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open',
  resolution TEXT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ==========================================
-- 11. AUDIT LOGS (immutable — no delete policy)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL DEFAULT 'd3b07384-d113-495f-a5d6-84cdca334237'::uuid,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY ANDテナント隔離ポリシー
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bag_sequence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to retrieve current authenticated user's organization_id
-- We define a function to make policies cleaner and faster
CREATE OR REPLACE FUNCTION public.current_user_org()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users on profiles" ON public.profiles;
CREATE POLICY "Allow users to read profiles in same organization" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated' AND (id = auth.uid() OR organization_id = public.current_user_org()));

CREATE POLICY "Allow users to insert their own profile on signup" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Allow updates for self or admin in same organization" ON public.profiles
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      id = auth.uid() OR 
      (organization_id = public.current_user_org() AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('plant_head', 'plant_manager'))
    )
  );

CREATE POLICY "Allow delete for admins in same organization" ON public.profiles
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    organization_id = public.current_user_org() AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('plant_head', 'plant_manager')
  );

-- 2. General Tenant Isolation Policies for Other Tables
-- Hospitals
DROP POLICY IF EXISTS "Allow all operations for authenticated users on hospitals" ON public.hospitals;
CREATE POLICY "Strict tenant isolation on hospitals" ON public.hospitals
  FOR ALL USING (auth.role() = 'authenticated' AND organization_id = public.current_user_org());

-- Vehicles
DROP POLICY IF EXISTS "Allow all operations for authenticated users on vehicles" ON public.vehicles;
CREATE POLICY "Strict tenant isolation on vehicles" ON public.vehicles
  FOR ALL USING (auth.role() = 'authenticated' AND organization_id = public.current_user_org());

-- Routes
DROP POLICY IF EXISTS "Allow all operations for authenticated users on routes" ON public.routes;
CREATE POLICY "Strict tenant isolation on routes" ON public.routes
  FOR ALL USING (auth.role() = 'authenticated' AND organization_id = public.current_user_org());

-- Bag Sequence
DROP POLICY IF EXISTS "Allow all operations for authenticated users on bag_sequence" ON public.bag_sequence;
CREATE POLICY "Strict tenant isolation on bag_sequence" ON public.bag_sequence
  FOR ALL USING (auth.role() = 'authenticated' AND organization_id = public.current_user_org());

-- Batches
DROP POLICY IF EXISTS "Allow all operations for authenticated users on batches" ON public.batches;
CREATE POLICY "Strict tenant isolation on batches" ON public.batches
  FOR ALL USING (auth.role() = 'authenticated' AND organization_id = public.current_user_org());

-- Bags
DROP POLICY IF EXISTS "Allow all operations for authenticated users on bags" ON public.bags;
CREATE POLICY "Strict tenant isolation on bags" ON public.bags
  FOR ALL USING (auth.role() = 'authenticated' AND organization_id = public.current_user_org());

-- Scan Events
DROP POLICY IF EXISTS "Allow all operations for authenticated users on scan_events" ON public.scan_events;
CREATE POLICY "Strict tenant isolation on scan_events" ON public.scan_events
  FOR ALL USING (auth.role() = 'authenticated' AND organization_id = public.current_user_org());

-- Manifests
DROP POLICY IF EXISTS "Allow all operations for authenticated users on manifests" ON public.manifests;
CREATE POLICY "Strict tenant isolation on manifests" ON public.manifests
  FOR ALL USING (auth.role() = 'authenticated' AND organization_id = public.current_user_org());

-- Discrepancies
DROP POLICY IF EXISTS "Allow all operations for authenticated users on discrepancies" ON public.discrepancies;
CREATE POLICY "Strict tenant isolation on discrepancies" ON public.discrepancies
  FOR ALL USING (auth.role() = 'authenticated' AND organization_id = public.current_user_org());

-- Audit Logs (Read/Insert only)
DROP POLICY IF EXISTS "Allow read for authenticated users on audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow insert for authenticated users on audit logs" ON public.audit_logs;
CREATE POLICY "Strict tenant isolation select on audit_logs" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'authenticated' AND organization_id = public.current_user_org());

CREATE POLICY "Strict tenant isolation insert on audit_logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND organization_id = public.current_user_org());
