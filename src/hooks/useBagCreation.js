import { useState } from 'react';
import { generateBagIds } from '../lib/bagId';
import { createBags } from '../lib/api/bags';
import { insertAuditLog } from '../lib/api/auditLogs';
import { bagSchema } from '../lib/validation/schemas';
import { branding } from '../config/branding';

export default function useBagCreation() {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBags, setNewBags] = useState([]);
  const [form, setForm] = useState({ hospital_id: '', category: 'Yellow', quantity: 1 });
  const [error, setError] = useState('');

  const executeCreate = async (supabase, user, hospitals, onSuccess) => {
    setCreating(true);
    setError('');
    try {
      const hospital = hospitals.find(h => h.id === form.hospital_id);
      if (!hospital) throw new Error(`Please select a ${branding.nomenclature.hcf}`);
      const qty = Math.min(Math.max(1, Number(form.quantity)), 50);

      const bagIds = await generateBagIds(supabase, hospital, form.category, qty);
      const rows = bagIds.map(bid => ({
        barcode: bid,
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        hcf_code: hospital.hcf_code || null,
        district: hospital.district,
        state: hospital.state || branding.regulatory.stateCode,
        category: form.category,
        status: 'created',
      }));

      // Zod Validation
      rows.forEach(r => bagSchema.parse(r));

      const inserted = await createBags(supabase, rows, user?.organization_id);

      // Audit log
      insertAuditLog(supabase, {
        userId: user?.id,
        userName: user?.name,
        action: 'BAGS_CREATED',
        entity: 'BAG',
        details: `Created ${qty} ${form.category} bags for ${hospital.name}`
      }, user?.organization_id).catch(() => {}); // Best effort

      setNewBags(inserted || rows);
      setError('');
      if (onSuccess) onSuccess(qty);
    } catch (err) {
      setError(err.message || 'Failed to create bags');
    } finally {
      setCreating(false);
    }
  };

  const resetCreation = () => {
    setNewBags([]);
    setError('');
    setForm({ hospital_id: '', category: 'Yellow', quantity: 1 });
  };

  return {
    showCreate,
    setShowCreate,
    creating,
    newBags,
    form,
    setForm,
    error,
    setError,
    executeCreate,
    resetCreation
  };
}
