import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Hospitals from '../../pages/admin/Hospitals';
import * as AuthContext from '../../context/AuthContext';
import * as hospitalsApi from '../../lib/api/hospitals';
import * as auditApi from '../../lib/api/auditLogs';

describe('Admin Hospitals Page Component', () => {
  const mockAdmin = {
    id: 'admin-1',
    name: 'Admin Alice',
    role: 'admin',
    organization_id: 'org-1'
  };

  const mockHospitals = [
    {
      id: 'hosp-1',
      name: 'City General Hospital',
      hcf_code: 'HCF0001',
      type: 'General',
      hospital_type: 'bedded',
      bedded: true,
      beds: 120,
      district: 'Dhanbad',
      state: 'JH',
      address: 'Main Road',
      pincode: '826001',
      contact: '9876543210'
    },
    {
      id: 'hosp-2',
      name: 'Central Diagnostic Lab',
      hcf_code: 'HCF0002',
      type: 'Lab',
      hospital_type: 'non_bedded',
      bedded: false,
      beds: null,
      district: 'Ranchi',
      state: 'JH',
      address: 'Station Road',
      pincode: '834001',
      contact: '9876543211'
    }
  ];

  const mockSupabase = {};

  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockAdmin,
      supabase: mockSupabase
    });

    vi.spyOn(hospitalsApi, 'fetchHospitals').mockResolvedValue(mockHospitals);
    vi.spyOn(hospitalsApi, 'createHospital').mockResolvedValue({ id: 'hosp-3' });
    vi.spyOn(hospitalsApi, 'updateHospital').mockResolvedValue({ id: 'hosp-1' });
    vi.spyOn(hospitalsApi, 'deleteHospital').mockResolvedValue(true);
    vi.spyOn(auditApi, 'insertAuditLog').mockResolvedValue({ id: 'audit-1' });
  });

  it('renders hospital data table and statistics', async () => {
    render(<Hospitals />);

    await waitFor(() => {
      expect(hospitalsApi.fetchHospitals).toHaveBeenCalledWith(mockSupabase, 'org-1');
    });

    expect(screen.getByText('City General Hospital')).toBeInTheDocument();
    expect(screen.getByText('Central Diagnostic Lab')).toBeInTheDocument();
    expect(screen.getByText('HCF0001')).toBeInTheDocument();
  });

  it('creates new hospital through modal form', async () => {
    render(<Hospitals />);

    await waitFor(() => {
      expect(screen.getByText('City General Hospital')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /➕ add/i });
    fireEvent.click(addBtn);

    expect(screen.getByPlaceholderText(/e\.g\., District General Hospital/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/e\.g\., District General Hospital/i), { target: { value: 'Apex Medical College' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., Dhanbad/i), { target: { value: 'Bokaro' } });
    fireEvent.change(screen.getByPlaceholderText(/full address/i), { target: { value: 'Sector 4' } });
    fireEvent.change(screen.getByPlaceholderText(/phone number/i), { target: { value: '9876543299' } });
    fireEvent.change(screen.getByPlaceholderText('826001'), { target: { value: '827001' } });

    const submitBtn = screen.getByRole('button', { name: /^add hcf$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(hospitalsApi.createHospital).toHaveBeenCalledWith(
        mockSupabase,
        expect.objectContaining({
          name: 'Apex Medical College',
          district: 'Bokaro',
          address: 'Sector 4',
          contact: '9876543299'
        }),
        'org-1'
      );
    });
  });

  it('edits existing hospital through modal form', async () => {
    render(<Hospitals />);

    await waitFor(() => {
      expect(screen.getByText('City General Hospital')).toBeInTheDocument();
    });

    const editBtns = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editBtns[0]);

    expect(screen.getByText(/Edit HCF/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/e\.g\., District General Hospital/i);
    fireEvent.change(nameInput, { target: { value: 'City General Hospital (Renovated)' } });

    const saveBtn = screen.getByRole('button', { name: /update hcf/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(hospitalsApi.updateHospital).toHaveBeenCalledWith(
        mockSupabase,
        'hosp-1',
        expect.objectContaining({
          name: 'City General Hospital (Renovated)'
        }),
        'org-1'
      );
    });
  });

  it('deletes hospital on confirmation', async () => {
    render(<Hospitals />);

    await waitFor(() => {
      expect(screen.getByText('City General Hospital')).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(hospitalsApi.deleteHospital).toHaveBeenCalledWith(mockSupabase, 'hosp-1', 'org-1');
      expect(auditApi.insertAuditLog).toHaveBeenCalled();
    });
  });
});
