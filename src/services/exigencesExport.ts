
import jsPDF from 'jspdf';
import { 
  formatState, 
  formatResponsabilities,
  createAndDownloadPdf
} from './pdfManager';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Exports requirements (exigences) to PDF format
 */
export const exportExigencesToPdf = (exigences: any[], title: string = 'Liste des exigences') => {
  createAndDownloadPdf((doc) => {
    // Date de génération
    const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
    
    // Add title and date
    doc.setFontSize(18);
    doc.text(title, 50, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Généré le: ${currentDate}`, 10, 40);
    
    // Table of requirements
    const headers = [['Nom', 'Responsabilités', 'État']];
    
    const data = exigences.map(exigence => [
      exigence.nom,
      formatResponsabilities(exigence.responsabilites),
      exigence.exclusion ? 'Exclusion' : formatState(exigence.atteinte)
    ]);
    
    (doc as any).autoTable({
      startY: 45,
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
