import React from 'react';
import { jsPDF } from 'jspdf';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfExportProps {
  data: any;
  title: string;
  fileName: string;
}

export function PdfExport({ data, title, fileName }: PdfExportProps) {
  const generatePdf = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Add data
    let yPosition = 40;
    Object.entries(data).forEach(([key, value]) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`${key}:`, 20, yPosition);
      doc.setFontSize(12);
      doc.text(`${value}`, 20, yPosition + 7);
      yPosition += 20;
    });
    
    // Save the PDF
    doc.save(`${fileName}-${new Date().toISOString()}.pdf`);
  };

  return (
    <Button
      onClick={generatePdf}
      variant="outline"
      className="gap-2"
    >
      <FileDown className="h-4 w-4" />
      Export PDF
    </Button>
  );
}