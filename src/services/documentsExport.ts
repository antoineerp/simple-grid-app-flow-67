
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document } from '@/types/documents';
import { 
  formatState, 
  formatResponsabilities,
  createAndDownloadPdf
} from './pdfManager';

/**
 * Exports documents to PDF format
 */
export const exportDocumentsToPdf = (documents: Document[], title: string = 'Gestion Documentaire') => {
  createAndDownloadPdf((doc, startY) => {
    // Table of documents
    const headers = [['Nom', 'Lien', 'Responsabilités', 'État']];
    
    const data = documents.map(doc => [
      doc.nom,
      doc.fichier_path || '-',
      formatResponsabilities(doc.responsabilites),
      formatState(doc.etat)
    ]);
    
    // Générer le tableau avec autoTable
    autoTable(doc, {
      startY: startY,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 60 },
        3: { cellWidth: 30 }
      }
    });
    
    console.log(`Tableau de documents généré avec ${data.length} documents`);
  }, title);
};
