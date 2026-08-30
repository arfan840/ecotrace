/**
 * Data access and API module for Biomedical Waste Reports
 */

export async function fetchHospitalsForFilters(supabase, organizationId = null) {
  let query = supabase.from('hospitals').select('id, name, district').order('name');
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchFilteredHospitals(supabase, filters = {}, organizationId = null) {
  let query = supabase.from('hospitals').select('id, name, type, bedded, district');
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  if (filters.hospital_id) query = query.eq('id', filters.hospital_id);
  if (filters.district) query = query.ilike('district', `%${filters.district}%`);
  if (filters.hospital_type === 'bedded') query = query.eq('bedded', true);
  if (filters.hospital_type === 'non_bedded') query = query.eq('bedded', false);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchBagsForReport(supabase, hospitalIds, startDate, endDate, category = null, organizationId = null) {
  let query = supabase.from('bags').select('hospital_id, hospital_name, category, weight, received_weight, status, created_at, received_at');
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  query = query.in('hospital_id', hospitalIds);
  query = query.gte('created_at', startDate).lte('created_at', endDate);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}
