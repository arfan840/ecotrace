import { useState, useEffect, useCallback } from 'react';
import { isWebBluetoothSupported, connectBluetoothScale, disconnectActiveDevice } from '../lib/bluetoothScale';

export default function useBluetoothScale() {
  const [weight, setWeight] = useState('');
  const [btLoading, setBtLoading] = useState(false);
  const [btStatus, setBtStatus] = useState('');

  const triggerBluetoothWeigh = useCallback(() => {
    if (isWebBluetoothSupported()) {
      setBtLoading(true);
      setBtStatus('Initializing Bluetooth...');
      connectBluetoothScale(
        (val) => {
          setWeight(val);
          setBtLoading(false);
          setBtStatus('✅ Weight received successfully!');
        },
        (err) => {
          setBtLoading(false);
          setBtStatus(`❌ Bluetooth Error: ${err.message || err}`);
        },
        (statusText) => {
          setBtStatus(`📶 ${statusText}`);
        }
      );
    } else {
      setBtStatus('❌ Bluetooth not supported in this browser.');
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnectActiveDevice();
    };
  }, []);

  return {
    weight,
    setWeight,
    btLoading,
    btStatus,
    triggerBluetoothWeigh,
  };
}
