
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  createAndDownloadPdf
} from './pdfManager';

/**
 * Exports bibliothèque documents to PDF format
 */
export const exportBibliothecaireDocsToPdf = (documents: any[], groups: any[], title: string = 'Bibliothèque de documents') => {
  createAndDownloadPdf((doc, startY) => {
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
      if (!doc.groupId) {
        data.push([
          '-',
          doc.name || doc.nom,
          doc.link || doc.lien || '-'
        ]);
      }
    });
    
    // Generate table
    autoTable(doc, {
      startY: startY,
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
    
    console.log(`Tableau de bibliothèque généré avec ${data.length} documents`);
  }, title);
};
