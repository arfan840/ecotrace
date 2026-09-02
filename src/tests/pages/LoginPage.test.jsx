import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import * as AuthContext from '../../context/AuthContext';
import * as bluetoothScale from '../../lib/bluetoothScale';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('LoginPage Component', () => {
  const mockLogin = vi.fn();
  const mockSupabase = {
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: null, error: new Error('Auth error') })
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.signUp.mockResolvedValue({ data: null, error: new Error('Auth error') });
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      login: mockLogin,
      supabase: mockSupabase
    });

    vi.spyOn(bluetoothScale, 'isScaleConnected').mockReturnValue(false);
    vi.spyOn(bluetoothScale, 'isWebBluetoothSupported').mockReturnValue(true);
    vi.spyOn(bluetoothScale, 'getConnectedDeviceName').mockReturnValue('');
  });

  it('renders login form with inputs and sign in action', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('signs in driver and navigates to /driver', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'driver' });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'driver1@ecotrace.io' } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('driver1@ecotrace.io', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/driver');
    });
  });

  it('signs in plant manager and navigates to /plant', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'plant_manager' });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'manager@ecotrace.io' } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('manager@ecotrace.io', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/plant');
    });
  });

  it('displays error message on invalid credentials', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Connection error'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'admin@ecotrace.io' } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'wrongpassword' } });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Connection error/i)).toBeInTheDocument();
    });
  });

  it('shows Bluetooth scale panel when driver or hcf email is typed', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Weighing Scale Setup/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'driver@test.com' } });

    expect(screen.getByText(/Weighing Scale Setup/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pair & connect scale/i })).toBeInTheDocument();
  });
});
