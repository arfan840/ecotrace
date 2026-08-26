/**
 * Data access and API module for Waste Treatment Batches
 */

export async function fetchBatches(supabase, organizationId = null) {
  let query = supabase.from('batches').select('*').order('created_at', { ascending: false });
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createBatch(supabase, { batchNumber, bagCount, totalWeight, treatmentType, operator }, organizationId = null) {
  const payload = {
    batch_number: batchNumber,
    bag_count: bagCount,
    total_weight: totalWeight,
    treatment_type: treatmentType,
    operator,
    status: 'pending',
    organization_id: organizationId,
    created_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase.from('batches').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function treatBatch(supabase, batchId, method, operatorName, organizationId = null) {
  const now = new Date().toISOString();
  let query = supabase.from('batches').update({
    status: 'treated',
    treatment_type: method,
    treated_at: now,
    operator: operatorName
  }).eq('id', batchId);
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data;
}
