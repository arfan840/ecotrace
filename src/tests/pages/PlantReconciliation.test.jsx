import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlantReconciliation from '../../pages/plant/Reconciliation';
import * as AuthContext from '../../context/AuthContext';
import * as routesApi from '../../lib/api/routes';
import * as bagsApi from '../../lib/api/bags';
import * as discrepanciesApi from '../../lib/api/discrepancies';
import * as auditApi from '../../lib/api/auditLogs';

describe('Plant Reconciliation Page Component', () => {
  const mockUser = {
    id: 'plant-user-1',
    name: 'Operator Sam',
    role: 'plant_operator',
    organization_id: 'org-1'
  };

  const mockRoutes = [
    {
      id: 'route-1',
      date: '2026-09-01',
      driver_name: 'Driver Dan',
      vehicle_number: 'JH01-9999',
      status: 'closed'
    }
  ];

  const mockSupabase = {};

  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      supabase: mockSupabase
    });

    vi.spyOn(routesApi, 'fetchRoutes').mockResolvedValue(mockRoutes);
    vi.spyOn(discrepanciesApi, 'createDiscrepancy').mockResolvedValue({ id: 'disc-1' });
    vi.spyOn(auditApi, 'insertAuditLog').mockResolvedValue({ id: 'audit-1' });
  });

  it('renders route list and reconciles a balanced route with zero discrepancies', async () => {
    const balancedBags = [
      {
        id: 'bag-1',
        barcode: 'JH-DHA-HCF0001-Y-20260901-000001',
        status: 'received',
        category: 'Yellow',
        weight: 3.5,
        hospital_name: 'Metro Hospital'
      }
    ];
    vi.spyOn(bagsApi, 'fetchBagsByRoute').mockResolvedValue(balancedBags);

    render(<PlantReconciliation />);

    await waitFor(() => {
      expect(routesApi.fetchRoutes).toHaveBeenCalledWith(mockSupabase, 'org-1');
    });

    expect(screen.getByText('JH01-9999')).toBeInTheDocument();

    const reconcileBtn = screen.getByRole('button', { name: /reconcile/i });
    fireEvent.click(reconcileBtn);

    await waitFor(() => {
      expect(bagsApi.fetchBagsByRoute).toHaveBeenCalledWith(mockSupabase, 'route-1', 'org-1');
      expect(screen.getByText(/All 1 bags accounted for/i)).toBeInTheDocument();
    });
  });

  it('detects missing bag discrepancy and logs discrepancy report', async () => {
    const unbalancedBags = [
      {
        id: 'bag-collected-only',
        barcode: 'JH-DHA-HCF0001-R-20260901-000002',
        status: 'collected', // Collected but not received at plant
        category: 'Red',
        weight: 2.0,
        hospital_name: 'City Clinic'
      }
    ];
    vi.spyOn(bagsApi, 'fetchBagsByRoute').mockResolvedValue(unbalancedBags);

    render(<PlantReconciliation />);

    await waitFor(() => {
      expect(screen.getByText('JH01-9999')).toBeInTheDocument();
    });

    const reconcileBtn = screen.getByRole('button', { name: /reconcile/i });
    fireEvent.click(reconcileBtn);

    await waitFor(() => {
      expect(screen.getByText(/Missing Bags \(1\)/i)).toBeInTheDocument();
    });

    const logDiscBtn = screen.getByRole('button', { name: /log discrepancy/i });
    fireEvent.click(logDiscBtn);

    await waitFor(() => {
      expect(discrepanciesApi.createDiscrepancy).toHaveBeenCalledWith(
        mockSupabase,
        expect.objectContaining({
          bagId: 'bag-collected-only',
          barcode: 'JH-DHA-HCF0001-R-20260901-000002',
          type: 'missing',
          routeId: 'route-1'
        }),
        'org-1'
      );
      expect(auditApi.insertAuditLog).toHaveBeenCalled();
    });
  });
});
