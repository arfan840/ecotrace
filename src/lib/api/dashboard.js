/**
 * Data access and API module for Dashboard statistics
 */

export async function fetchAdminDashboardData(supabase, organizationId = null) {
  const queries = [
    supabase.from('bags').select('*'),
    supabase.from('discrepancies').select('*'),
    supabase.from('batches').select('*'),
    supabase.from('hospitals').select('id, bedded'),
    supabase.from('vehicles').select('id', { count: 'exact', head: true }),
  ];

  if (organizationId) {
    queries[0] = queries[0].eq('organization_id', organizationId);
    queries[1] = queries[1].eq('organization_id', organizationId);
    queries[2] = queries[2].eq('organization_id', organizationId);
    queries[3] = queries[3].eq('organization_id', organizationId);
    queries[4] = queries[4].eq('organization_id', organizationId);
  }

  const [{ data: bags }, { data: discs }, { data: batches }, { data: hcfs }, { count: vehicleCount }] = await Promise.all(queries);

  return { bags: bags || [], discs: discs || [], batches: batches || [], hcfs: hcfs || [], vehicleCount: vehicleCount || 0 };
}

export async function fetchPlantDashboardData(supabase, organizationId = null) {
  const queries = [
    supabase.from('routes').select('*').eq('status', 'active'),
    supabase.from('bags').select('status'),
    supabase.from('discrepancies').select('status').eq('status', 'open'),
    supabase.from('batches').select('*'),
  ];

  if (organizationId) {
    queries[0] = queries[0].eq('organization_id', organizationId);
    queries[1] = queries[1].eq('organization_id', organizationId);
    queries[2] = queries[2].eq('organization_id', organizationId);
    queries[3] = queries[3].eq('organization_id', organizationId);
  }

  const [{ data: routes }, { data: bagStatuses }, { data: openDiscs }, { data: batches }] = await Promise.all(queries);

  return { routes: routes || [], bagStatuses: bagStatuses || [], openDiscCount: (openDiscs || []).length, batches: batches || [] };
}
