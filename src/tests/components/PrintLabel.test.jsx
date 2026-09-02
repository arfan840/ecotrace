import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrintLabelButton, { printLabels } from '../../components/PrintLabel';
import * as qrGenerator from '../../lib/qrGenerator';

describe('PrintLabel Component and Utility', () => {
  const mockBags = [
    {
      barcode: 'JH-DHA-HCF0001-Y-20260901-000001',
      hospital_name: 'City General Hospital',
      category: 'Yellow',
      created_at: '2026-09-01T10:00:00Z'
    },
    {
      barcode: 'JH-DHA-HCF0001-R-20260901-000002',
      hospital_name: 'City General Hospital',
      category: 'Red',
      created_at: '2026-09-01T10:05:00Z'
    }
  ];

  let mockWindowOpen;
  let mockDocumentWrite;
  let mockDocumentClose;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDocumentWrite = vi.fn();
    mockDocumentClose = vi.fn();
    mockWindowOpen = vi.spyOn(window, 'open').mockReturnValue({
      document: {
        write: mockDocumentWrite,
        close: mockDocumentClose
      }
    });

    vi.spyOn(qrGenerator, 'generateQRDataUrl').mockResolvedValue('data:image/png;base64,mockQR');
  });

  it('renders disabled button when no bags are provided', () => {
    render(<PrintLabelButton bags={[]} />);
    const btn = screen.getByRole('button', { name: /print labels/i });
    expect(btn).toBeDisabled();
  });

  it('renders active button and triggers print flow on click', async () => {
    render(<PrintLabelButton bags={mockBags} label="Print Barcodes" />);
    const btn = screen.getByRole('button', { name: /print barcodes/i });
    expect(btn).toBeEnabled();

    fireEvent.click(btn);

    await waitFor(() => {
      expect(qrGenerator.generateQRDataUrl).toHaveBeenCalledWith('JH-DHA-HCF0001-Y-20260901-000001', { size: 220 });
      expect(mockWindowOpen).toHaveBeenCalled();
      expect(mockDocumentWrite).toHaveBeenCalledWith(expect.stringContaining('JH-DHA-HCF0001-Y-20260901-000001'));
      expect(mockDocumentWrite).toHaveBeenCalledWith(expect.stringContaining('Yellow Waste'));
      expect(mockDocumentClose).toHaveBeenCalled();
    });
  });

  it('printLabels direct function call opens window and renders all bags', async () => {
    await printLabels(mockBags);

    expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank', 'width=800,height=600');
    expect(mockDocumentWrite).toHaveBeenCalledWith(expect.stringContaining('City General Hospital'));
    expect(mockDocumentWrite).toHaveBeenCalledWith(expect.stringContaining('Red Waste'));
    expect(mockDocumentClose).toHaveBeenCalled();
  });
});
