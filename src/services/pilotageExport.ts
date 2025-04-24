
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  createAndDownloadPdf
} from './pdfManager';

/**
 * Exports pilotage documents to PDF format
 */
export const exportPilotageToOdf = (documents: any[], title: string = 'Documents de pilotage') => {
  createAndDownloadPdf((doc, startY) => {
    // Define columns for the table
    const headers = [['Ordre', 'Nom du document', 'Lien']];
    
    // Convert data for the table
    const data = documents.map(doc => [
      doc.ordre,
      doc.nom,
      doc.lien || '-'
    ]);
    
    // Generate the table
    autoTable(doc, {
      startY: startY,
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
    
    console.log(`Tableau de pilotage généré avec ${data.length} documents`);
  }, title);
};
