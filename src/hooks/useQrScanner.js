import { useState, useRef, useEffect, useCallback } from 'react';
import { logError } from '../lib/errors';

export default function useQrScanner() {
  const [scanning, setScanning] = useState(false);
  const scannerInstanceRef = useRef(null);

  const stopScanner = useCallback(async () => {
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop();
      } catch (err) {
        logError('useQrScanner.stopScanner', err);
      } finally {
        scannerInstanceRef.current = null;
        setScanning(false);
      }
    }
  }, []);

  const startScanner = useCallback(async (elementId, onScanSuccess, onScanError) => {
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(elementId);
      scannerInstanceRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner();
          if (onScanSuccess) await onScanSuccess(decodedText);
        },
        onScanError || (() => {})
      );
    } catch (err) {
      setScanning(false);
      throw err;
    }
  }, [stopScanner]);

  useEffect(() => {
    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch((err) => {
          logError('useQrScanner.unmountCleanup', err);
        });
      }
    };
  }, []);

  return {
    scanning,
    startScanner,
    stopScanner,
  };
}
