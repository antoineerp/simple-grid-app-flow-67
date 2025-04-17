
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  getCurrentLogo,
  generateFilename
} from './pdfUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Exports collaborator statistics to PDF format
 */
export const exportCollaborateurStatsToPdf = (membre: any) => {
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
    const title = `Statistiques de ${membre.prenom} ${membre.nom} (${membre.initiales})`;
    doc.setFontSize(18);
    doc.text(title, 50, 20);
    
    // Ajout de la fonction
    doc.setFontSize(14);
    doc.text(`Fonction: ${membre.fonction}`, 50, 30);
    
    // Ajout de la date
    doc.setFontSize(10);
    doc.text(`Généré le: ${currentDate}`, 10, 40);
    
    // Table des statistiques pour les exigences
    const headersExigences = [['Type', 'Nombre']];
    const dataExigences = [
      ['Responsable (R)', membre.exigences.r],
      ['Approbateur (A)', membre.exigences.a],
      ['Consulté (C)', membre.exigences.c],
      ['Informé (I)', membre.exigences.i],
      ['Total', membre.exigences.r + membre.exigences.a + membre.exigences.c + membre.exigences.i]
    ];
    
    (doc as any).autoTable({
      startY: 50,
      head: headersExigences,
      body: dataExigences,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      tableWidth: 100,
      margin: { left: 50 }
    });
    
    // Titre pour les documents
    doc.setFontSize(14);
    doc.text('Documents', 50, (doc as any).lastAutoTable.finalY + 15);
    
    // Table des statistiques pour les documents
    const headersDocuments = [['Type', 'Nombre']];
    const dataDocuments = [
      ['Responsable (R)', membre.documents.r],
      ['Approbateur (A)', membre.documents.a],
      ['Consulté (C)', membre.documents.c],
      ['Informé (I)', membre.documents.i],
      ['Total', membre.documents.r + membre.documents.a + membre.documents.c + membre.documents.i]
    ];
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: headersDocuments,
      body: dataDocuments,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      tableWidth: 100,
      margin: { left: 50 }
    });
    
    // Total général
    const totalGeneral = 
      membre.exigences.r + membre.exigences.a + membre.exigences.c + membre.exigences.i +
      membre.documents.r + membre.documents.a + membre.documents.c + membre.documents.i;
    
    doc.setFontSize(14);
    doc.text(`Total des responsabilités: ${totalGeneral}`, 50, (doc as any).lastAutoTable.finalY + 15);
    
    // Enregistrement du PDF
    const filename = `statistiques_${membre.prenom}_${membre.nom}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(filename.toLowerCase().replace(/ /g, '_'));
  };
};
