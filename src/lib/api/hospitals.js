/**
 * Data access and API module for Healthcare Facilities (HCFs / Hospitals)
 */

export async function fetchHospitals(supabase, organizationId = null) {
  let query = supabase.from('hospitals').select('*').order('name');
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createHospital(supabase, hospitalData, organizationId = null) {
  const payload = {
    ...hospitalData,
    organization_id: organizationId,
    bedded: hospitalData.hospital_type === 'bedded' || hospitalData.bedded === true,
    beds: hospitalData.beds ? Number(hospitalData.beds) : null,
  };
  
  const { data, error } = await supabase.from('hospitals').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateHospital(supabase, id, hospitalData, organizationId = null) {
  const payload = {
    ...hospitalData,
    bedded: hospitalData.hospital_type === 'bedded' || hospitalData.bedded === true,
    beds: hospitalData.beds ? Number(hospitalData.beds) : null,
  };

  let query = supabase.from('hospitals').update(payload).eq('id', id);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteHospital(supabase, id, organizationId = null) {
  let query = supabase.from('hospitals').delete().eq('id', id);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { error } = await query;
  if (error) throw new Error(error.message);
  return true;
}
