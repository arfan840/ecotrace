import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlantGateScan from '../../pages/plant/GateScan';
import * as AuthContext from '../../context/AuthContext';
import * as bagsApi from '../../lib/api/bags';
import * as auditApi from '../../lib/api/auditLogs';

vi.mock('../../hooks/useQrScanner', () => ({
  default: () => ({
    scanning: false,
    startScanner: vi.fn(),
    stopScanner: vi.fn()
  })
}));

vi.mock('../../hooks/useBluetoothScale', () => ({
  default: () => ({
    weight: '4.85',
    setWeight: vi.fn(),
    btLoading: false,
    btStatus: 'Scale connected',
    triggerBluetoothWeigh: vi.fn()
  })
}));

describe('Plant Gate Scan Page Component', () => {
  const mockPlantOperator = {
    id: 'operator-1',
    name: 'Plant Operator Paul',
    role: 'plant_operator',
    organization_id: 'org-1'
  };

  const mockSupabase = {};

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockPlantOperator,
      supabase: mockSupabase
    });

    vi.spyOn(auditApi, 'insertAuditLog').mockResolvedValue({ id: 'audit-1' });
  });

  it('renders Gate Scan modes and initial manual entry layout', () => {
    render(
      <MemoryRouter>
        <PlantGateScan />
      </MemoryRouter>
    );

    expect(screen.getByText(/Gate Scan — Receive Bags/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Direct Scan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verified \(Weighing\)/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter bag ID\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Bag/i })).toBeInTheDocument();
  });

  it('scans and adds bag directly in fast mode', async () => {
    const validBag = {
      id: 'bag-fast-1',
      barcode: 'JH-DHA-HCF0001-Y-20260830-000001',
      status: 'collected',
      category: 'Yellow',
      weight: 3.5,
      hospital_name: 'Metro Hospital'
    };

    vi.spyOn(bagsApi, 'lookupBagByBarcode').mockResolvedValue(validBag);

    render(
      <MemoryRouter>
        <PlantGateScan />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Enter bag ID\.\.\./i);
    const addBtn = screen.getByRole('button', { name: /Add Bag/i });

    fireEvent.change(input, { target: { value: validBag.barcode } });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText(validBag.barcode)).toBeInTheDocument();
      expect(screen.getByText(/Metro Hospital/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirm Receipt of 1 Bags/i })).toBeInTheDocument();
    });
  });

  it('handles already received status error', async () => {
    vi.spyOn(bagsApi, 'lookupBagByBarcode').mockResolvedValue({
      id: 'bag-received',
      barcode: 'JH-DHA-HCF0001-Y-20260830-000002',
      status: 'received'
    });

    render(
      <MemoryRouter>
        <PlantGateScan />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Enter bag ID\.\.\./i);
    const addBtn = screen.getByRole('button', { name: /Add Bag/i });

    fireEvent.change(input, { target: { value: 'JH-DHA-HCF0001-Y-20260830-000002' } });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText(/already received/i)).toBeInTheDocument();
    });
  });

  it('handles verified weighing flow and saves batch gate receipt', async () => {
    const validBag = {
      id: 'bag-verified-1',
      barcode: 'JH-DHA-HCF0001-R-20260830-000003',
      status: 'collected',
      category: 'Red',
      weight: 4.8,
      hospital_name: 'City Clinic'
    };

    vi.spyOn(bagsApi, 'lookupBagByBarcode').mockResolvedValue(validBag);
    vi.spyOn(bagsApi, 'updateBagStatus').mockResolvedValue({ ...validBag, status: 'received' });
    vi.spyOn(bagsApi, 'insertScanEvent').mockResolvedValue({ id: 'scan-1' });

    render(
      <MemoryRouter>
        <PlantGateScan />
      </MemoryRouter>
    );

    // Switch to verified mode
    const verifiedModeBtn = screen.getByRole('button', { name: /Verified \(Weighing\)/i });
    fireEvent.click(verifiedModeBtn);

    // Enter bag ID
    const input = screen.getByPlaceholderText(/Enter bag ID\.\.\./i);
    const addBtn = screen.getByRole('button', { name: /Add Bag/i });

    fireEvent.change(input, { target: { value: validBag.barcode } });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText(/Verify Bag Weight/i)).toBeInTheDocument();
    });

    // Enter gate scale weight
    const weightInput = screen.getByPlaceholderText('0.000');
    fireEvent.change(weightInput, { target: { value: '4.85' } });

    const confirmAddBtn = screen.getByRole('button', { name: /Confirm & Add/i });
    fireEvent.click(confirmAddBtn);

    await waitFor(() => {
      expect(screen.getByText(validBag.barcode)).toBeInTheDocument();
    });

    // Confirm batch receipt at facility
    const batchConfirmBtn = screen.getByRole('button', { name: /Confirm Receipt of 1 Bags/i });
    fireEvent.click(batchConfirmBtn);

    await waitFor(() => {
      expect(bagsApi.updateBagStatus).toHaveBeenCalledWith(
        mockSupabase,
        'bag-verified-1',
        'received',
        expect.objectContaining({
          received_by: 'operator-1',
          received_weight: 4.85
        }),
        'org-1'
      );
      expect(bagsApi.insertScanEvent).toHaveBeenCalled();
    });
  });
});
