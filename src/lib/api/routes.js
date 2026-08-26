/**
 * Data access and API module for Driver Routes and Manifests
 */

export async function fetchRoutes(supabase, organizationId = null) {
  let query = supabase.from('routes').select('*, profiles(name)').order('date', { ascending: false });
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchActiveRouteForDriver(supabase, driverId, organizationId = null) {
  let query = supabase.from('routes')
    .select('*')
    .eq('driver_id', driverId)
    .eq('status', 'active');
    
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function startRoute(supabase, { driverId, driverName, vehicleId, vehicleNumber }, organizationId = null) {
  const payload = {
    driver_id: driverId,
    driver_name: driverName,
    vehicle_id: vehicleId,
    vehicle_number: vehicleNumber,
    status: 'active',
    date: new Date().toISOString(),
    organization_id: organizationId,
  };
  
  const { data, error } = await supabase.from('routes').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function closeRoute(supabase, routeId, organizationId = null) {
  let query = supabase.from('routes').update({ status: 'closed' }).eq('id', routeId);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchManifests(supabase, routeId, organizationId = null) {
  let query = supabase.from('manifests').select('*').eq('route_id', routeId);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createManifest(supabase, manifestData, organizationId = null) {
  const payload = {
    ...manifestData,
    organization_id: organizationId,
  };
  const { data, error } = await supabase.from('manifests').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}
