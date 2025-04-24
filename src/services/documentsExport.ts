
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  formatState, 
  formatResponsabilities,
  createAndDownloadPdf
} from './pdfManager';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Document } from '@/types/documents';

/**
 * Exports documents to PDF format
 */
export const exportDocumentsToPdf = (documents: Document[], title: string = 'Gestion Documentaire') => {
  console.log("Début de l'export PDF des documents:", documents.length);
  
  createAndDownloadPdf((doc) => {
    // Get page width for centering elements
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Current date
    const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
    
    // Add title - Centered
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    
    // Add date - Centered
    doc.setFontSize(10);
    doc.text(`Généré le: ${currentDate}`, pageWidth / 2, 30, { align: 'center' });
    
    // Add separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 35, pageWidth - 10, 35);
    
    // Table of documents
    const headers = [['Nom', 'Lien', 'Responsabilités', 'État']];
    
    const data = documents.map(doc => [
      doc.nom,
      doc.fichier_path || '-',
      formatResponsabilities(doc.responsabilites),
      formatState(doc.etat)
    ]);
    
    try {
      // Using explicit autoTable import
      autoTable(doc, {
        startY: 40,
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
      
      // Add version information
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Version du PDF: 1.0.1`, 15, doc.internal.pageSize.getHeight() - 10);
      
    } catch (error) {
      console.error("Erreur lors de la génération du tableau des documents:", error);
      doc.setTextColor(255, 0, 0);
      doc.setFontSize(12);
      doc.text("Erreur lors de la génération du tableau. Veuillez réessayer.", 20, 100);
    }
    
    console.log("Génération du PDF des documents terminée");
  }, title);
};
