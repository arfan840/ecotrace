import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HcfScan from '../../pages/hcf/Scan';
import * as AuthContext from '../../context/AuthContext';
import * as routesApi from '../../lib/api/routes';
import * as bagsApi from '../../lib/api/bags';
import * as auditApi from '../../lib/api/auditLogs';

// Mock child hooks to isolate page logic
vi.mock('../../hooks/useQrScanner', () => ({
  default: () => ({
    scanning: false,
    startScanner: vi.fn(),
    stopScanner: vi.fn()
  })
}));

vi.mock('../../hooks/useBluetoothScale', () => ({
  default: () => ({
    weight: '3.45',
    setWeight: vi.fn(),
    btLoading: false,
    btStatus: 'Connected',
    triggerBluetoothWeigh: vi.fn()
  })
}));

describe('HCF Scan Page Component', () => {
  const mockUser = {
    id: 'user-hcf-1',
    name: 'Nurse Joy',
    role: 'hcf',
    hospital_id: 'hosp-001',
    organization_id: 'org-1'
  };

  const mockSupabase = {};

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      supabase: mockSupabase
    });

    vi.spyOn(routesApi, 'fetchRoutes').mockResolvedValue([
      { id: 'route-1', status: 'active', driver_name: 'Driver Dave', vehicle_number: 'JH01-1234', date: '2026-08-30' },
      { id: 'route-2', status: 'closed', driver_name: 'Driver Dan', vehicle_number: 'JH01-5678', date: '2026-08-29' }
    ]);

    vi.spyOn(auditApi, 'insertAuditLog').mockResolvedValue({ id: 'audit-1' });
  });

  it('renders active routes in the route selection dropdown', async () => {
    render(
      <MemoryRouter>
        <HcfScan />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(routesApi.fetchRoutes).toHaveBeenCalled();
    });

    expect(screen.getByText(/JH01-1234/i)).toBeInTheDocument();
    // Inactive/closed route should be filtered out
    expect(screen.queryByText(/JH01-5678/i)).not.toBeInTheDocument();
  });

  it('blocks dispatch when bag belongs to another facility', async () => {
    vi.spyOn(bagsApi, 'lookupBagByBarcode').mockResolvedValue({
      id: 'bag-99',
      barcode: 'JH-DHA-HCF0002-Y-20260830-000001',
      hospital_id: 'hosp-OTHER',
      status: 'created',
      category: 'Yellow'
    });

    render(
      <MemoryRouter>
        <HcfScan />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/JH01-1234/i)).toBeInTheDocument();
    });

    // Select route
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'route-1' } });

    // Lookup bag
    const manualInput = screen.getByPlaceholderText(/e\.g\. JH-DGH/i);
    const lookupBtn = screen.getByRole('button', { name: /lookup/i });

    fireEvent.change(manualInput, { target: { value: 'JH-DHA-HCF0002-Y-20260830-000001' } });
    fireEvent.click(lookupBtn);

    await waitFor(() => {
      expect(screen.getByText(/belongs to another Healthcare Facility/i)).toBeInTheDocument();
    });
  });

  it('blocks dispatch when bag is not found or already collected', async () => {
    vi.spyOn(bagsApi, 'lookupBagByBarcode').mockResolvedValueOnce(null);

    render(
      <MemoryRouter>
        <HcfScan />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/JH01-1234/i)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'route-1' } });

    const manualInput = screen.getByPlaceholderText(/e\.g\. JH-DGH/i);
    const lookupBtn = screen.getByRole('button', { name: /lookup/i });

    fireEvent.change(manualInput, { target: { value: 'INVALID-CODE' } });
    fireEvent.click(lookupBtn);

    await waitFor(() => {
      expect(screen.getByText(/Bag not found in database/i)).toBeInTheDocument();
    });
  });

  it('successfully completes dispatch flow for a valid bag', async () => {
    const validBag = {
      id: 'bag-1',
      barcode: 'JH-DHA-HCF0001-Y-20260830-000001',
      hospital_id: 'hosp-001',
      hospital_name: 'Apex Hospital',
      status: 'created',
      category: 'Yellow'
    };

    vi.spyOn(bagsApi, 'lookupBagByBarcode').mockResolvedValue(validBag);
    vi.spyOn(bagsApi, 'updateBagStatus').mockResolvedValue({ ...validBag, status: 'collected' });
    vi.spyOn(bagsApi, 'insertScanEvent').mockResolvedValue({ id: 'scan-1' });

    render(
      <MemoryRouter>
        <HcfScan />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/JH01-1234/i)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'route-1' } });

    const manualInput = screen.getByPlaceholderText(/e\.g\. JH-DGH/i);
    const lookupBtn = screen.getByRole('button', { name: /lookup/i });

    fireEvent.change(manualInput, { target: { value: validBag.barcode } });
    fireEvent.click(lookupBtn);

    await waitFor(() => {
      expect(screen.getByText(/Apex Hospital/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /complete dispatch/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(bagsApi.updateBagStatus).toHaveBeenCalledWith(
        mockSupabase,
        'bag-1',
        'collected',
        expect.objectContaining({
          weight: 3.45,
          collected_by: 'user-hcf-1',
          route_id: 'route-1'
        }),
        'org-1'
      );
      expect(bagsApi.insertScanEvent).toHaveBeenCalled();
    });
  });
});
