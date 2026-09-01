import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlantBatches from '../../pages/plant/Batches';
import * as AuthContext from '../../context/AuthContext';
import * as batchesApi from '../../lib/api/batches';
import * as bagsApi from '../../lib/api/bags';
import * as auditApi from '../../lib/api/auditLogs';

describe('Plant Batches Page Component', () => {
  const mockUser = {
    id: 'plant-user-1',
    name: 'Operator Sam',
    role: 'plant_operator',
    organization_id: 'org-1'
  };

  const mockBatches = [
    {
      id: 'batch-1',
      batch_number: 'BATCH-20260901-01',
      bag_count: 10,
      total_weight: 25.5,
      treatment_type: 'Autoclave',
      operator: 'Operator Sam',
      status: 'created',
      created_at: '2026-09-01T10:00:00Z'
    }
  ];

  const mockAvailBags = [
    {
      id: 'bag-1',
      barcode: 'JH-DHA-HCF0001-Y-20260901-000001',
      hospital_name: 'Metro Hospital',
      category: 'Yellow',
      weight: 3.5
    },
    {
      id: 'bag-2',
      barcode: 'JH-DHA-HCF0001-R-20260901-000002',
      hospital_name: 'City Clinic',
      category: 'Red',
      weight: 2.0
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
    vi.spyOn(bagsApi, 'fetchBagsByStatus').mockResolvedValue(mockAvailBags);
    vi.spyOn(batchesApi, 'createBatch').mockResolvedValue({ id: 'new-batch-101' });
    vi.spyOn(bagsApi, 'linkBagsToBatch').mockResolvedValue([{ id: 'bag-1' }]);
    vi.spyOn(auditApi, 'insertAuditLog').mockResolvedValue({ id: 'audit-1' });
  });

  it('renders existing treatment batches in data table', async () => {
    render(<PlantBatches />);

    await waitFor(() => {
      expect(batchesApi.fetchBatches).toHaveBeenCalled();
      expect(bagsApi.fetchBagsByStatus).toHaveBeenCalledWith(mockSupabase, 'received', 'org-1');
    });

    expect(screen.getByText('BATCH-20260901-01')).toBeInTheDocument();
    expect(screen.getByText('Autoclave')).toBeInTheDocument();
    expect(screen.getByText('Operator Sam')).toBeInTheDocument();
  });

  it('opens batch creation form and creates new batch from selected bags', async () => {
    render(<PlantBatches />);

    await waitFor(() => {
      expect(screen.getByText('BATCH-20260901-01')).toBeInTheDocument();
    });

    // Toggle Create Batch section
    const openBtn = screen.getByRole('button', { name: /create batch/i });
    fireEvent.click(openBtn);

    expect(screen.getByText(/Create New Batch from Received Bags/i)).toBeInTheDocument();
    expect(screen.getByText('JH-DHA-HCF0001-Y-20260901-000001')).toBeInTheDocument();

    // Select bag 1
    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is select all, second is bag-1
    fireEvent.click(checkboxes[1]);

    const submitBtn = await screen.findByRole('button', { name: /create batch \(1 bags\)/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(batchesApi.createBatch).toHaveBeenCalledWith(
        mockSupabase,
        expect.objectContaining({
          bagCount: 1,
          totalWeight: 3.5,
          treatmentType: 'Autoclave',
          operator: 'Operator Sam'
        }),
        'org-1'
      );
      expect(bagsApi.linkBagsToBatch).toHaveBeenCalledWith(
        mockSupabase,
        ['bag-1'],
        'new-batch-101',
        'org-1'
      );
    });
  });
});
