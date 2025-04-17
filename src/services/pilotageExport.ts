
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  getCurrentLogo, 
  formatState, 
  generateFilename 
} from './pdfUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Exports pilotage documents to PDF format (formerly ODF)
 */
export const exportPilotageToOdf = (documents: any[], title: string = 'Documents de pilotage') => {
  // Create a new PDF document
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
    
    // Définition des colonnes pour le tableau
    const headers = [['Ordre', 'Nom du document', 'Lien']];
    
    // Conversion des données pour le tableau
    const data = documents.map(doc => [
      doc.ordre,
      doc.nom,
      doc.lien || '-'
    ]);
    
    // Génération du tableau
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
    
    // Enregistrement du PDF avec le nom standardisé
    doc.save(generateFilename('Documents_Pilotage'));
  };
};
