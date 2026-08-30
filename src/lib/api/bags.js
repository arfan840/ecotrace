/**
 * Data access and API module for waste bags tracking
 */

export async function fetchBags(supabase, organizationId = null) {
  let query = supabase.from('bags').select('*, hospitals(name)').order('created_at', { ascending: false });
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchFilteredBags(supabase, organizationId = null, { status, category, search, page = 1, limit = 25 } = {}) {
  let query = supabase.from('bags').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (search) {
    query = query.or(`barcode.ilike.%${search}%,hospital_name.ilike.%${search}%`);
  }
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { bags: data || [], total: count || 0 };
}

export async function lookupBagByBarcode(supabase, barcode, organizationId = null) {
  let query = supabase.from('bags').select('*, hospitals(name, beds, district)').eq('barcode', barcode);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createBags(supabase, bagsDataList, organizationId = null) {
  const payloads = bagsDataList.map(b => ({
    ...b,
    organization_id: organizationId,
    status: b.status || 'created'
  }));
  
  const { data, error } = await supabase.from('bags').insert(payloads).select();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateBagStatus(supabase, bagId, status, additionalData = {}, organizationId = null) {
  const payload = {
    status,
    ...additionalData
  };
  
  let query = supabase.from('bags').update(payload).eq('id', bagId);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchBagsByRoute(supabase, routeId, organizationId = null) {
  let query = supabase.from('bags').select('*').eq('route_id', routeId);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchBagsByBatch(supabase, batchId, organizationId = null) {
  let query = supabase.from('bags').select('*').eq('batch_id', batchId);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Insert a scan event record for bag tracking.
 * @param {object} supabase - Supabase client instance
 * @param {object} eventData - { bag_id, barcode, scanned_by, scanner_name, scan_type, weight?, gps_lat?, gps_lng?, route_id? }
 */
export async function insertScanEvent(supabase, eventData) {
  let query = supabase.from('scan_events').insert(eventData).select();
  if (!Array.isArray(eventData)) {
    query = query.single();
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchBagsByStatus(supabase, status, organizationId = null) {
  let query = supabase.from('bags').select('*').eq('status', status).order('received_at', { ascending: false });
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function linkBagsToBatch(supabase, bagIds, batchId, organizationId = null) {
  let query = supabase.from('bags').update({ status: 'in_batch', batch_id: batchId }).in('id', bagIds);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query.select();
  if (error) throw new Error(error.message);
  return data || [];
}

