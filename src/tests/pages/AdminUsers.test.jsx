import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Users from '../../pages/admin/Users';
import * as AuthContext from '../../context/AuthContext';
import * as profilesApi from '../../lib/api/profiles';
import * as hospitalsApi from '../../lib/api/hospitals';

describe('Admin Users Management Page Component', () => {
  const mockAdmin = {
    id: 'admin-1',
    name: 'Admin Alice',
    role: 'admin',
    organization_id: 'org-1'
  };

  const mockUsers = [
    {
      id: 'user-1',
      name: 'Driver Dan',
      email: 'dan@ecotrace.io',
      role: 'driver',
      phone: '9876543210',
      hospital_id: null
    },
    {
      id: 'user-2',
      name: 'Nurse Nancy',
      email: 'nancy@metrohospital.com',
      role: 'hcf',
      phone: '9876543211',
      hospital_id: 'hosp-1',
      hospitals: { name: 'Metro Hospital' }
    }
  ];

  const mockHospitals = [
    { id: 'hosp-1', name: 'Metro Hospital' }
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

    vi.spyOn(profilesApi, 'fetchProfiles').mockResolvedValue(mockUsers);
    vi.spyOn(hospitalsApi, 'fetchHospitals').mockResolvedValue(mockHospitals);
    vi.spyOn(profilesApi, 'updateProfile').mockResolvedValue({ id: 'user-1' });
    vi.spyOn(profilesApi, 'deleteProfile').mockResolvedValue(true);
  });

  it('renders user list and associated details', async () => {
    render(<Users />);

    await waitFor(() => {
      expect(profilesApi.fetchProfiles).toHaveBeenCalledWith(mockSupabase, 'org-1');
      expect(hospitalsApi.fetchHospitals).toHaveBeenCalledWith(mockSupabase, 'org-1');
    });

    expect(screen.getByText('Driver Dan')).toBeInTheDocument();
    expect(screen.getByText('Nurse Nancy')).toBeInTheDocument();
    expect(screen.getByText('dan@ecotrace.io')).toBeInTheDocument();
    expect(screen.getByText('🏥 Metro Hospital')).toBeInTheDocument();
  });

  it('edits user profile and submits updates', async () => {
    render(<Users />);

    await waitFor(() => {
      expect(screen.getByText('Driver Dan')).toBeInTheDocument();
    });

    const editBtns = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editBtns[0]);

    expect(screen.getByText('Edit User')).toBeInTheDocument();

    const nameInput = screen.getByDisplayValue('Driver Dan');
    fireEvent.change(nameInput, { target: { value: 'Driver Daniel' } });

    const updateBtn = screen.getByRole('button', { name: /update/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(profilesApi.updateProfile).toHaveBeenCalledWith(
        mockSupabase,
        'user-1',
        expect.objectContaining({
          name: 'Driver Daniel',
          email: 'dan@ecotrace.io',
          role: 'driver'
        }),
        'org-1'
      );
    });
  });

  it('deletes user on confirmation', async () => {
    render(<Users />);

    await waitFor(() => {
      expect(screen.getByText('Driver Dan')).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(profilesApi.deleteProfile).toHaveBeenCalledWith(mockSupabase, 'user-1', 'org-1');
    });
  });
});
