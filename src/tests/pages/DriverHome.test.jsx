import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DriverHome from '../../pages/driver/Home';
import * as AuthContext from '../../context/AuthContext';
import * as routesApi from '../../lib/api/routes';
import * as vehiclesApi from '../../lib/api/vehicles';
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
    weight: '5.20',
    setWeight: vi.fn(),
    btLoading: false,
    btStatus: 'Scale connected',
    triggerBluetoothWeigh: vi.fn()
  })
}));

describe('Driver Home Page Component', () => {
  const mockDriver = {
    id: 'driver-101',
    name: 'Driver Dave',
    role: 'driver',
    organization_id: 'org-1'
  };

  const mockSupabase = {};

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockDriver,
      supabase: mockSupabase
    });

    vi.spyOn(auditApi, 'insertAuditLog').mockResolvedValue({ id: 'audit-1' });
  });

  describe('When driver has no active route', () => {
    beforeEach(() => {
      vi.spyOn(routesApi, 'fetchActiveRouteForDriver').mockResolvedValue(null);
      vi.spyOn(vehiclesApi, 'fetchVehicles').mockResolvedValue([
        { id: 'v-1', number: 'JH01-1001', status: 'active' },
        { id: 'v-2', number: 'JH01-1002', status: 'inactive' }
      ]);
    });

    it('renders vehicle selection and start route action', async () => {
      render(
        <MemoryRouter>
          <DriverHome />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(vehiclesApi.fetchVehicles).toHaveBeenCalled();
      });

      expect(screen.getByText(/Start Your Route/i)).toBeInTheDocument();
      expect(screen.getByText(/JH01-1001/i)).toBeInTheDocument();
      expect(screen.queryByText(/JH01-1002/i)).not.toBeInTheDocument();
    });

    it('starts route when a vehicle is selected', async () => {
      vi.spyOn(routesApi, 'startRoute').mockResolvedValue({ id: 'new-route-1' });

      render(
        <MemoryRouter>
          <DriverHome />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/JH01-1001/i)).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'v-1' } });

      const startBtn = screen.getByRole('button', { name: /start route/i });
      fireEvent.click(startBtn);

      await waitFor(() => {
        expect(routesApi.startRoute).toHaveBeenCalledWith(
          mockSupabase,
          expect.objectContaining({
            driverId: 'driver-101',
            vehicleId: 'v-1',
            vehicleNumber: 'JH01-1001'
          }),
          'org-1'
        );
      });
    });
  });

  describe('When driver has an active route', () => {
    const activeRoute = {
      id: 'active-route-1',
      vehicle_number: 'JH01-1001',
      driver_id: 'driver-101',
      status: 'active'
    };

    beforeEach(() => {
      vi.spyOn(routesApi, 'fetchActiveRouteForDriver').mockResolvedValue(activeRoute);
      vi.spyOn(bagsApi, 'fetchBagsByRoute').mockResolvedValue([
        { id: 'b-1', status: 'collected' },
        { id: 'b-2', status: 'created' }
      ]);
    });

    it('renders active route information and collection statistics', async () => {
      render(
        <MemoryRouter>
          <DriverHome />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(bagsApi.fetchBagsByRoute).toHaveBeenCalledWith(mockSupabase, 'active-route-1', 'org-1');
      });

      expect(screen.getByText(/Active Route/i)).toBeInTheDocument();
      expect(screen.getByText(/JH01-1001/i)).toBeInTheDocument();
      // Collected count is 1
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('enforces hospital bed capacity rules during manual lookup', async () => {
      vi.spyOn(bagsApi, 'lookupBagByBarcode').mockResolvedValue({
        id: 'bag-bed-limit',
        barcode: 'JH-DHA-HCF0001-Y-20260830-000001',
        status: 'created',
        hospitals: {
          name: 'Metropolitan Hospital',
          beds: 50
        }
      });

      render(
        <MemoryRouter>
          <DriverHome />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/JH01-1001/i)).toBeInTheDocument();
      });

      const manualInput = screen.getByPlaceholderText(/enter bag id\.\.\./i);
      const findBtn = screen.getByRole('button', { name: /→ go/i });

      fireEvent.change(manualInput, { target: { value: 'JH-DHA-HCF0001-Y-20260830-000001' } });
      fireEvent.click(findBtn);

      await waitFor(() => {
        expect(screen.getByText(/has 50 beds \(>30\)/i)).toBeInTheDocument();
      });
    });

    it('completes collection confirmation flow for valid bag', async () => {
      const validBag = {
        id: 'bag-valid-1',
        barcode: 'JH-DHA-HCF0002-Y-20260830-000001',
        status: 'created',
        category: 'Yellow',
        hospital_name: 'City Clinic',
        hospitals: {
          name: 'City Clinic',
          beds: 10
        }
      };

      vi.spyOn(bagsApi, 'lookupBagByBarcode').mockResolvedValue(validBag);
      vi.spyOn(bagsApi, 'updateBagStatus').mockResolvedValue({ ...validBag, status: 'collected' });
      vi.spyOn(bagsApi, 'insertScanEvent').mockResolvedValue({ id: 'scan-1' });

      render(
        <MemoryRouter>
          <DriverHome />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/JH01-1001/i)).toBeInTheDocument();
      });

      const manualInput = screen.getByPlaceholderText(/enter bag id\.\.\./i);
      const findBtn = screen.getByRole('button', { name: /→ go/i });

      fireEvent.change(manualInput, { target: { value: validBag.barcode } });
      fireEvent.click(findBtn);

      await waitFor(() => {
        expect(screen.getByText(/City Clinic/i)).toBeInTheDocument();
      });

      const confirmBtn = screen.getByRole('button', { name: /save & collect/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(bagsApi.updateBagStatus).toHaveBeenCalledWith(
          mockSupabase,
          'bag-valid-1',
          'collected',
          expect.objectContaining({
            weight: 5.2,
            collected_by: 'driver-101',
            route_id: 'active-route-1'
          }),
          'org-1'
        );
      });
    });
  });
});
