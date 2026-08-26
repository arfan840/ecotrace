/**
 * Data access and API module for Vehicles
 */

export async function fetchVehicles(supabase, organizationId = null) {
  let query = supabase.from('vehicles').select('*, profiles(name)').order('number');
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createVehicle(supabase, vehicleData, organizationId = null) {
  const payload = {
    ...vehicleData,
    organization_id: organizationId,
  };
  const { data, error } = await supabase.from('vehicles').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateVehicle(supabase, id, vehicleData, organizationId = null) {
  let query = supabase.from('vehicles').update(vehicleData).eq('id', id);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteVehicle(supabase, id, organizationId = null) {
  let query = supabase.from('vehicles').delete().eq('id', id);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { error } = await query;
  if (error) throw new Error(error.message);
  return true;
}
