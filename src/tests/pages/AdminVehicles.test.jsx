import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Vehicles from '../../pages/admin/Vehicles';
import * as AuthContext from '../../context/AuthContext';
import * as vehiclesApi from '../../lib/api/vehicles';
import * as profilesApi from '../../lib/api/profiles';
import * as auditApi from '../../lib/api/auditLogs';

describe('Admin Vehicles Page Component', () => {
  const mockAdmin = {
    id: 'admin-1',
    name: 'Admin Alice',
    role: 'admin',
    organization_id: 'org-1'
  };

  const mockVehicles = [
    {
      id: 'veh-1',
      number: 'JH05AE1234',
      type: 'Van',
      status: 'active',
      driver_id: 'driver-1',
      profiles: { name: 'Driver Dave' }
    }
  ];

  const mockDrivers = [
    { id: 'driver-1', name: 'Driver Dave', role: 'driver' },
    { id: 'driver-2', name: 'Driver Dan', role: 'driver' }
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

    vi.spyOn(vehiclesApi, 'fetchVehicles').mockResolvedValue(mockVehicles);
    vi.spyOn(profilesApi, 'fetchProfiles').mockResolvedValue(mockDrivers);
    vi.spyOn(vehiclesApi, 'createVehicle').mockResolvedValue({ id: 'veh-2' });
    vi.spyOn(vehiclesApi, 'updateVehicle').mockResolvedValue({ id: 'veh-1' });
    vi.spyOn(vehiclesApi, 'deleteVehicle').mockResolvedValue(true);
    vi.spyOn(auditApi, 'insertAuditLog').mockResolvedValue({ id: 'audit-1' });
  });

  it('renders vehicle list table and assigned drivers', async () => {
    render(<Vehicles />);

    await waitFor(() => {
      expect(vehiclesApi.fetchVehicles).toHaveBeenCalledWith(mockSupabase, 'org-1');
      expect(profilesApi.fetchProfiles).toHaveBeenCalledWith(mockSupabase, 'org-1');
    });

    expect(screen.getByText('JH05AE1234')).toBeInTheDocument();
    expect(screen.getByText('Driver Dave')).toBeInTheDocument();
  });

  it('creates a new vehicle through the modal form', async () => {
    render(<Vehicles />);

    await waitFor(() => {
      expect(screen.getByText('JH05AE1234')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /➕ add vehicle/i });
    fireEvent.click(addBtn);

    const input = screen.getByPlaceholderText(/e\.g\., JH05AE1234/i);
    fireEvent.change(input, { target: { value: 'JH01CD5678' } });

    const submitBtn = screen.getByRole('button', { name: /^add vehicle$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(vehiclesApi.createVehicle).toHaveBeenCalledWith(
        mockSupabase,
        expect.objectContaining({
          number: 'JH01CD5678',
          type: 'Van',
          status: 'active'
        }),
        'org-1'
      );
    });
  });

  it('edits an existing vehicle', async () => {
    render(<Vehicles />);

    await waitFor(() => {
      expect(screen.getByText('JH05AE1234')).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editBtn);

    expect(screen.getByText('Edit Vehicle')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /update/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(vehiclesApi.updateVehicle).toHaveBeenCalledWith(
        mockSupabase,
        'veh-1',
        expect.objectContaining({
          number: 'JH05AE1234'
        }),
        'org-1'
      );
    });
  });

  it('deletes a vehicle on confirmation', async () => {
    render(<Vehicles />);

    await waitFor(() => {
      expect(screen.getByText('JH05AE1234')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(vehiclesApi.deleteVehicle).toHaveBeenCalledWith(mockSupabase, 'veh-1', 'org-1');
      expect(auditApi.insertAuditLog).toHaveBeenCalled();
    });
  });
});
