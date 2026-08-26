import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isWebBluetoothSupported, connectBluetoothScale, disconnectActiveDevice } from '../../lib/bluetoothScale';

describe('Web Bluetooth Weighing Scale Module', () => {
  let originalNavigator;

  beforeEach(() => {
    originalNavigator = global.navigator;
    disconnectActiveDevice();
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    vi.restoreAllMocks();
  });

  describe('isWebBluetoothSupported', () => {
    it('should return false if navigator is undefined', () => {
      global.navigator = undefined;
      expect(isWebBluetoothSupported()).toBe(false);
    });

    it('should return false if navigator.bluetooth is missing', () => {
      global.navigator = { bluetooth: undefined };
      expect(isWebBluetoothSupported()).toBe(false);
    });

    it('should return true if navigator.bluetooth is defined', () => {
      global.navigator = { bluetooth: {} };
      expect(isWebBluetoothSupported()).toBe(true);
    });
  });

  describe('connectBluetoothScale', () => {
    it('should invoke onError if Web Bluetooth is not supported', async () => {
      global.navigator = { bluetooth: undefined };
      const onWeight = vi.fn();
      const onError = vi.fn();
      
      await connectBluetoothScale(onWeight, onError);
      
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0].message).toContain('Web Bluetooth is not supported');
    });

    it('should request device, connect GATT, and set notifications on success', async () => {
      const mockCharacteristic = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        startNotifications: vi.fn().mockResolvedValue({}),
        uuid: '00002a9d-0000-1000-8000-00805f9b34fb'
      };

      const mockService = {
        getCharacteristic: vi.fn().mockResolvedValue(mockCharacteristic)
      };

      const mockGatt = {
        connect: vi.fn().mockImplementation(async () => mockGatt),
        disconnect: vi.fn(),
        get primaryServices() { return []; },
        getPrimaryService: vi.fn().mockResolvedValue(mockService),
        connected: true
      };

      const mockDevice = {
        id: 'device-123',
        name: 'Eco Scale Pro',
        gatt: mockGatt,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      const mockBluetooth = {
        requestDevice: vi.fn().mockResolvedValue(mockDevice)
      };

      global.navigator = { bluetooth: mockBluetooth };

      const onWeight = vi.fn();
      const onError = vi.fn();
      const onStatus = vi.fn();

      await connectBluetoothScale(onWeight, onError, onStatus);

      expect(mockBluetooth.requestDevice).toHaveBeenCalled();
      expect(mockGatt.connect).toHaveBeenCalled();
      expect(mockGatt.getPrimaryService).toHaveBeenCalled();
      expect(mockCharacteristic.startNotifications).toHaveBeenCalled();
      expect(onStatus).toHaveBeenCalledWith('Awaiting weight reading...');
    });

    it('should handle requestDevice rejection (user cancellation)', async () => {
      const mockBluetooth = {
        requestDevice: vi.fn().mockRejectedValue(new Error('User cancelled dialog'))
      };

      global.navigator = { bluetooth: mockBluetooth };

      const onWeight = vi.fn();
      const onError = vi.fn();

      await connectBluetoothScale(onWeight, onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toContain('User cancelled');
    });
  });
});
