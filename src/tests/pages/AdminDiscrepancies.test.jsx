import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Discrepancies from '../../pages/admin/Discrepancies';
import * as AuthContext from '../../context/AuthContext';
import * as discrepanciesApi from '../../lib/api/discrepancies';

describe('Admin Discrepancies Page Component', () => {
  const mockAdmin = {
    id: 'admin-1',
    name: 'Admin Alice',
    role: 'admin',
    organization_id: 'org-1'
  };

  const mockDiscrepancies = [
    {
      id: 'disc-1',
      barcode: 'JH-DHA-HCF0001-Y-20260901-000001',
      type: 'MISSING_AT_PLANT',
      description: 'Bag collected by driver but missing at plant scale weigh-in',
      created_at: '2026-09-01T12:00:00Z',
      status: 'open',
      resolution: null
    },
    {
      id: 'disc-2',
      barcode: 'JH-DHA-HCF0001-R-20260901-000002',
      type: 'WEIGHT_MISMATCH',
      description: 'Weight discrepancy > 1.5kg between pickup and intake',
      created_at: '2026-09-01T10:00:00Z',
      status: 'resolved',
      resolution: 'Verified with hospital scale recalibration log'
    }
  ];

  const mockSupabase = {};

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockAdmin,
      supabase: mockSupabase
    });

    vi.spyOn(discrepanciesApi, 'fetchDiscrepancies').mockResolvedValue(mockDiscrepancies);
    vi.spyOn(discrepanciesApi, 'resolveDiscrepancy').mockResolvedValue({ id: 'disc-1', status: 'resolved' });
  });

  it('renders discrepancy list with open and resolved counts', async () => {
    render(<Discrepancies />);

    await waitFor(() => {
      expect(discrepanciesApi.fetchDiscrepancies).toHaveBeenCalledWith(mockSupabase, 'org-1', { status: null });
    });

    expect(screen.getByText('1 open')).toBeInTheDocument();
    expect(screen.getByText('1 resolved')).toBeInTheDocument();
    expect(screen.getByText('JH-DHA-HCF0001-Y-20260901-000001')).toBeInTheDocument();
    expect(screen.getByText('Verified with hospital scale recalibration log')).toBeInTheDocument();
  });

  it('opens modal to resolve open discrepancy', async () => {
    render(<Discrepancies />);

    await waitFor(() => {
      expect(screen.getByText('JH-DHA-HCF0001-Y-20260901-000001')).toBeInTheDocument();
    });

    const resolveBtn = screen.getByRole('button', { name: /^resolve$/i });
    fireEvent.click(resolveBtn);

    expect(screen.getByText('Resolve Discrepancy')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/describe how the discrepancy was resolved/i);
    fireEvent.change(textarea, { target: { value: 'Located bag in secondary intake bay and logged' } });

    const markBtn = screen.getByRole('button', { name: /mark resolved/i });
    fireEvent.click(markBtn);

    await waitFor(() => {
      expect(discrepanciesApi.resolveDiscrepancy).toHaveBeenCalledWith(
        mockSupabase,
        'disc-1',
        'Located bag in secondary intake bay and logged',
        'admin-1',
        'org-1'
      );
    });
  });
});
