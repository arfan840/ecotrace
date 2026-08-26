/**
 * Data access and API module for Regulatory Immutable Audit Logs
 */

export async function fetchAuditLogs(supabase, organizationId = null, { search = '', page = 1, limit = 30 } = {}) {
  let query = supabase.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  if (search) {
    query = query.or(`action.ilike.%${search}%,user_name.ilike.%${search}%,entity.ilike.%${search}%,details.ilike.%${search}%`);
  }
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { logs: data || [], total: count || 0 };
}

export async function insertAuditLog(supabase, { userId, userName, action, entity, entityId, details }, organizationId = null) {
  const payload = {
    user_id: userId,
    user_name: userName,
    action,
    entity,
    entity_id: entityId || null,
    details,
    organization_id: organizationId,
    created_at: new Date().toISOString()
  };
  
  // Note: RLS might restrict inserts to authenticated users. We let the client handle catch.
  const { data, error } = await supabase.from('audit_logs').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchAuditLogsByEntity(supabase, entityId, organizationId = null) {
  let query = supabase.from('audit_logs').select('*').eq('entity_id', entityId).order('created_at', { ascending: true });
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}
