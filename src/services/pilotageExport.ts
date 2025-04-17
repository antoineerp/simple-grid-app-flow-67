
import jsPDF from 'jspdf';
import { 
  createAndDownloadPdf
} from './pdfManager';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Exports pilotage documents to PDF format
 */
export const exportPilotageToOdf = (documents: any[], title: string = 'Documents de pilotage') => {
  createAndDownloadPdf((doc) => {
    // Date de génération
    const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
    
    // Add title and date
    doc.setFontSize(18);
    doc.text(title, 50, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Généré le: ${currentDate}`, 10, 40);
    
    // Define columns for the table
    const headers = [['Ordre', 'Nom du document', 'Lien']];
    
    // Convert data for the table
    const data = documents.map(doc => [
      doc.ordre,
      doc.nom,
      doc.lien || '-'
    ]);
    
    // Generate the table
    (doc as any).autoTable({
      startY: 45,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 100 },
        2: { cellWidth: 70 }
      }
    });
  }, 'Documents_Pilotage');
};
