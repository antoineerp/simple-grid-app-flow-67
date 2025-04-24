
import jsPDF from 'jspdf';
import { 
  formatState, 
  formatResponsabilities,
  createAndDownloadPdf
} from './pdfManager';

export const exportExigencesToPdf = (exigences: any[], title: string = 'Liste des exigences') => {
  createAndDownloadPdf((doc, startY) => {
    const headers = [['Nom', 'Responsabilités', 'État']];
    
    const data = exigences.map(exigence => [
      exigence.nom,
      formatResponsabilities(exigence.responsabilites),
      exigence.exclusion ? 'Exclusion' : formatState(exigence.atteinte)
    ]);
    
    (doc as any).autoTable({
      startY: startY,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 70 },
        2: { cellWidth: 50 }
      }
    });
  }, title);
};
