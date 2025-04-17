
import { Document } from '@/types/documents';
import { 
  formatState, 
  formatResponsabilities,
  createAndDownloadPdf
} from './pdfManager';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Exports documents to PDF format
 */
export const exportDocumentsToPdf = (documents: Document[], title: string = 'Gestion Documentaire') => {
  createAndDownloadPdf((doc) => {
    // Date de génération
    const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
    
    // Add title and date
    doc.setFontSize(18);
    doc.text(title, 50, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Généré le: ${currentDate}`, 10, 40);
    
    // Table of documents
    const headers = [['Nom', 'Lien', 'Responsabilités', 'État']];
    
    const data = documents.map(doc => [
      doc.nom,
      doc.fichier_path || '-',
      formatResponsabilities(doc.responsabilites),
      formatState(doc.etat)
    ]);
    
    (doc as any).autoTable({
      startY: 45,
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
  }, title);
};
