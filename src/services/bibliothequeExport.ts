
import jsPDF from 'jspdf';
import { 
  createAndDownloadPdf
} from './pdfManager';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Exports bibliothèque documents to PDF format
 */
export const exportBibliothecaireDocsToPdf = (documents, groups, title = 'Bibliothèque de documents') => {
  createAndDownloadPdf((doc) => {
    // Date de génération
    const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
    
    // Add title and date
    doc.setFontSize(18);
    doc.text(title, 50, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Généré le: ${currentDate}`, 10, 40);
    
    // Prepare data for table
    const headers = [['Groupe', 'Nom du document', 'Lien']];
    
    const data = [];
    
    // Add documents from groups
    groups.forEach(group => {
      // Add group header if it has items
      if (group.items && group.items.length > 0) {
        group.items.forEach(doc => {
          data.push([
            group.name,
            doc.name,
            doc.link || '-'
          ]);
        });
      }
    });
    
    // Add individual documents (not in groups)
    documents.forEach(doc => {
      data.push([
        '-',
        doc.name,
        doc.link || '-'
      ]);
    });
    
    // Generate table
    (doc as any).autoTable({
      startY: 45,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 70 },
        2: { cellWidth: 60 }
      }
    });
  }, title);
};
