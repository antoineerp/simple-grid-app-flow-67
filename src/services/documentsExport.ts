
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  getCurrentLogo, 
  formatState, 
  formatResponsabilities,
  generateFilename
} from './pdfUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Exports documents to PDF format
 */
export const exportDocumentsToPdf = (documents: any[], title: string = 'Gestion Documentaire') => {
  const doc = new jsPDF();
  const logoPath = getCurrentLogo();
  
  // Date de génération
  const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  
  // Ajout du logo (s'adapte à l'image)
  const img = new Image();
  img.src = logoPath;
  
  img.onload = function() {
    const imgWidth = 30;
    const imgHeight = (img.height * imgWidth) / img.width;
    doc.addImage(img, 'PNG', 10, 10, imgWidth, imgHeight);
    
    // Ajout du titre
    doc.setFontSize(18);
    doc.text(title, 50, 20);
    
    // Ajout de la date
    doc.setFontSize(10);
    doc.text(`Généré le: ${currentDate}`, 10, 40);
    
    // Tableau des documents
    const headers = [['Nom', 'Lien', 'Responsabilités', 'État']];
    
    const data = documents.map(doc => [
      doc.nom,
      doc.lien || '-',
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
    
    // Enregistrement du PDF
    doc.save(generateFilename(title));
  };
};
