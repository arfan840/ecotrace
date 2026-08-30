import { useState, useEffect, useCallback } from 'react';
import { fetchFilteredBags } from '../lib/api/bags';
import { logError } from '../lib/errors';

export default function useBagFilters(supabase, organizationId) {
  const [data, setData] = useState({ bags: [], total: 0 });
  const [filters, setFilters] = useState({ status: '', category: '', search: '' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFilteredBags(supabase, organizationId, {
        status: filters.status,
        category: filters.category,
        search: filters.search,
        page,
        limit: 25
      });
      setData(result);
    } catch (err) {
      logError('useBagFilters.load', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, organizationId, filters.status, filters.category, filters.search, page]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    bags: data.bags,
    total: data.total,
    loading,
    filters,
    setFilters,
    page,
    setPage,
    refreshBags: load
  };
}
