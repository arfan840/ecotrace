import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlantTreatment from '../../pages/plant/Treatment';
import * as AuthContext from '../../context/AuthContext';
import * as batchesApi from '../../lib/api/batches';
import * as bagsApi from '../../lib/api/bags';
import * as auditApi from '../../lib/api/auditLogs';

describe('Plant Treatment & Certificates Page Component', () => {
  const mockUser = {
    id: 'operator-1',
    name: 'Operator Sam',
    role: 'plant_operator',
    organization_id: 'org-1'
  };

  const mockBatches = [
    {
      id: 'batch-101',
      batch_number: 'BATCH-20260901-01',
      bag_count: 5,
      total_weight: 15.0,
      treatment_type: 'Autoclave',
      operator: 'Operator Sam',
      status: 'pending',
      created_at: '2026-09-01T10:00:00Z'
    },
    {
      id: 'batch-102',
      batch_number: 'BATCH-20260901-02',
      bag_count: 8,
      total_weight: 22.0,
      treatment_type: 'Incineration',
      operator: 'Operator Sam',
      status: 'treated',
      treated_at: '2026-09-01T11:00:00Z',
      created_at: '2026-09-01T09:00:00Z'
    }
  ];

  const mockBatchBags = [
    {
      id: 'bag-1',
      barcode: 'JH-DHA-HCF0001-Y-20260901-000001',
      hospital_name: 'Apex Hospital',
      category: 'Yellow',
      weight: 3.5
    }
  ];

  const mockSupabase = {};

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      supabase: mockSupabase
    });

    vi.spyOn(batchesApi, 'fetchBatches').mockResolvedValue(mockBatches);
    vi.spyOn(bagsApi, 'fetchBagsByBatch').mockResolvedValue(mockBatchBags);
    vi.spyOn(batchesApi, 'treatBatch').mockResolvedValue({ id: 'batch-101', status: 'treated' });
    vi.spyOn(bagsApi, 'updateBagStatus').mockResolvedValue({ id: 'bag-1', status: 'treated' });
    vi.spyOn(bagsApi, 'insertScanEvent').mockResolvedValue({ id: 'scan-1' });
    vi.spyOn(auditApi, 'insertAuditLog').mockResolvedValue({ id: 'audit-1' });
  });

  it('renders list of batches in table', async () => {
    render(<PlantTreatment />);

    await waitFor(() => {
      expect(batchesApi.fetchBatches).toHaveBeenCalledWith(mockSupabase, 'org-1');
    });

    expect(screen.getByText('BATCH-20260901-01')).toBeInTheDocument();
    expect(screen.getByText('BATCH-20260901-02')).toBeInTheDocument();
  });

  it('opens batch details and allows treating a pending batch', async () => {
    render(<PlantTreatment />);

    await waitFor(() => {
      expect(screen.getByText('BATCH-20260901-01')).toBeInTheDocument();
    });

    const viewBtns = screen.getAllByRole('button', { name: /view/i });
    fireEvent.click(viewBtns[0]);

    await waitFor(() => {
      expect(bagsApi.fetchBagsByBatch).toHaveBeenCalledWith(mockSupabase, 'batch-101', 'org-1');
      expect(screen.getByText('JH-DHA-HCF0001-Y-20260901-000001')).toBeInTheDocument();
    });

    const treatBtn = screen.getByRole('button', { name: /mark as treated/i });
    fireEvent.click(treatBtn);

    await waitFor(() => {
      expect(batchesApi.treatBatch).toHaveBeenCalledWith(
        mockSupabase,
        'batch-101',
        'Autoclave',
        'Operator Sam',
        'org-1'
      );
      expect(bagsApi.updateBagStatus).toHaveBeenCalledWith(
        mockSupabase,
        'bag-1',
        'treated',
        {},
        'org-1'
      );
    });
  });

  it('displays print certificate option for treated batch', async () => {
    render(<PlantTreatment />);

    await waitFor(() => {
      expect(screen.getByText('BATCH-20260901-02')).toBeInTheDocument();
    });

    const viewBtns = screen.getAllByRole('button', { name: /view/i });
    fireEvent.click(viewBtns[1]);

    await waitFor(() => {
      expect(screen.getByText(/Print Certificate/i)).toBeInTheDocument();
    });
  });
});
