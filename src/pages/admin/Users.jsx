import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchProfiles, updateProfile, deleteProfile } from '../../lib/api/profiles';
import { fetchHospitals } from '../../lib/api/hospitals';
import { profileSchema } from '../../lib/validation/schemas';
import { branding } from '../../config/branding';

const ROLES = [
  { value: 'plant_head', label: 'Plant Head' },
  { value: 'plant_manager', label: 'Plant Manager' },
  { value: 'driver', label: 'Driver' },
  { value: 'regulatory', label: 'Regulatory Authority' },
  { value: 'hcf', label: branding.nomenclature.hcfShort + ' Staff' },
];

export default function Users() {
  const { supabase, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'driver', phone: '', hospital_id: '', password: '' });
  const [editId, setEditId] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    fetchHospitals(supabase, user?.organization_id).then(data => {
      setHospitals(data);
    }).catch(err => console.error(err));
  }, [supabase, user]);

  useEffect(() => {
    async function load() {
      try {
        let data = await fetchProfiles(supabase, user?.organization_id);
        if (roleFilter) data = data.filter(u => u.role === roleFilter);
        if (search) data = data.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()));
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [roleFilter, search, refresh, supabase, user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editId) {
      alert("Due to security constraints with the public Supabase API key, Admins cannot directly create new users here to prevent session loss. Instruct new employees to log in on the main screen to automatically provision their account!");
      setShowModal(false);
      return;
    }
    
    // Zod validation
    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      phone: form.phone,
      hospital_id: form.role === 'hcf' ? form.hospital_id || null : null
    };

    const parseResult = profileSchema.safeParse(payload);
    if (!parseResult.success) {
      alert('Validation Error: ' + parseResult.error.errors.map(err => err.message).join('\n'));
      return;
    }

    try {
      await updateProfile(supabase, editId, payload, user?.organization_id);
      setShowModal(false);
      setEditId(null);
      setRefresh(r => r + 1);
    } catch (err) {
      alert('Error updating user: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete user ${name}? This will fail if the user has recorded any history in the system.`)) return;
    try {
      await deleteProfile(supabase, id, user?.organization_id);
      setRefresh(r => r + 1);
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  return (
    <div className="slide-up">
      <div className="card-header">
        <h2>👥 User Management</h2>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm({ name: '', email: '', role: 'driver', phone: '', hospital_id: '', password: '' }); setShowModal(true); }}>+ Add User</button>
      </div>

      <div className="filter-bar">
        <div className="form-group">
          <label className="form-label">Search</label>
          <input className="form-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role / HCF</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className={`badge badge-${u.role === 'plant_head' ? 'treated' : u.role === 'driver' ? 'active' : u.role === 'hcf' ? 'collected' : 'pending'}`} style={{ width: 'fit-content' }}>
                        {ROLES.find(r => r.value === u.role)?.label || u.role}
                      </span>
                      {u.role === 'hcf' && u.hospitals?.name && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🏥 {u.hospitals.name}</span>
                      )}
                    </div>
                  </td>
                  <td>{u.phone}</td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setForm({ name: u.name, email: u.email, role: u.role, phone: u.phone, hospital_id: u.hospital_id || '', password: '' }); setEditId(u.id); setShowModal(true); }}>Edit</button>
                    <button className="btn btn-primary btn-sm" style={{ background: 'var(--accent-danger)' }} onClick={() => handleDelete(u.id, u.name)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit User' : 'Add User'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group"><label className="form-label">Name</label><input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>{ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              {form.role === 'hcf' && (
                <div className="form-group">
                  <label className="form-label">Associated {branding.nomenclature.hcf}</label>
                  <select className="form-select" value={form.hospital_id || ''} onChange={e => setForm(f => ({ ...f, hospital_id: e.target.value }))} required>
                    <option value="">Select {branding.nomenclature.hcfShort}...</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group"><label className="form-label">Password {editId ? '(leave blank to keep)' : ''}</label><input type="password" className="form-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} {...(!editId ? { required: true } : {})} /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
