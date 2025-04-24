
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  formatState, 
  formatResponsabilities,
  createAndDownloadPdf
} from './pdfManager';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Exigence } from '@/types/exigences';

/**
 * Exports requirements (exigences) to PDF format
 */
export const exportExigencesToPdf = (exigences: Exigence[], title: string = 'Liste des exigences') => {
  console.log("Début de l'export PDF des exigences:", exigences.length);
  
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
    
    // Table of requirements
    const headers = [['Nom', 'Responsabilités', 'État']];
    
    const data = exigences.map(exigence => [
      exigence.nom,
      formatResponsabilities(exigence.responsabilites),
      exigence.exclusion ? 'Exclusion' : formatState(exigence.atteinte)
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
          0: { cellWidth: 70 },
          1: { cellWidth: 70 },
          2: { cellWidth: 50 }
        }
      });
      
      // Add version information
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Version du PDF: 1.0.1`, 15, doc.internal.pageSize.getHeight() - 10);
      
    } catch (error) {
      console.error("Erreur lors de la génération du tableau des exigences:", error);
      doc.setTextColor(255, 0, 0);
      doc.setFontSize(12);
      doc.text("Erreur lors de la génération du tableau. Veuillez réessayer.", 20, 100);
    }
    
    console.log("Génération du PDF des exigences terminée");
  }, title);
};
