/**
 * Data access and API module for Reconciliation Discrepancies
 */

export async function fetchDiscrepancies(supabase, organizationId = null) {
  let query = supabase.from('discrepancies').select('*').order('created_at', { ascending: false });
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createDiscrepancy(supabase, { bagId, barcode, type, description, routeId }, organizationId = null) {
  const payload = {
    bag_id: bagId,
    barcode,
    type,
    description,
    route_id: routeId,
    status: 'open',
    organization_id: organizationId,
    created_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase.from('discrepancies').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function resolveDiscrepancy(supabase, id, resolution, resolvedBy, organizationId = null) {
  let query = supabase.from('discrepancies').update({
    status: 'resolved',
    resolution,
    resolved_by: resolvedBy,
    resolved_at: new Date().toISOString()
  }).eq('id', id);
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data;
}
