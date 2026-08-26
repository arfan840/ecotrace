/**
 * Data access and API module for User Profiles
 */

export async function fetchProfiles(supabase, organizationId = null) {
  let query = supabase.from('profiles').select('*, hospitals(name)').order('created_at', { ascending: false });
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchProfile(supabase, userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createProfile(supabase, profileData, organizationId = null) {
  const payload = {
    ...profileData,
    organization_id: organizationId,
  };
  const { data, error } = await supabase.from('profiles').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateProfile(supabase, id, profileData, organizationId = null) {
  let query = supabase.from('profiles').update(profileData).eq('id', id);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProfile(supabase, id, organizationId = null) {
  let query = supabase.from('profiles').delete().eq('id', id);
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { error } = await query;
  if (error) throw new Error(error.message);
  return true;
}
