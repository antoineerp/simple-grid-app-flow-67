
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
  
  // Prepare title
  const title = `Statistiques de ${membre.prenom} ${membre.nom} (${membre.initiales})`;
  
  // Add title and metadata immediately
  doc.setFontSize(18);
  doc.text(title, 50, 20);
  
  // Add role
  doc.setFontSize(14);
  doc.text(`Fonction: ${membre.fonction}`, 50, 30);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Généré le: ${currentDate}`, 10, 40);
  
  // Table for requirements statistics
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
  
  // Title for documents
  doc.setFontSize(14);
  doc.text('Documents', 50, (doc as any).lastAutoTable.finalY + 15);
  
  // Table for document statistics
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
  
  // Total
  const totalGeneral = 
    membre.exigences.r + membre.exigences.a + membre.exigences.c + membre.exigences.i +
    membre.documents.r + membre.documents.a + membre.documents.c + membre.documents.i;
  
  doc.setFontSize(14);
  doc.text(`Total des responsabilités: ${totalGeneral}`, 50, (doc as any).lastAutoTable.finalY + 15);
  
  // Try to add logo if available
  try {
    const img = new Image();
    img.src = logoPath;
    
    // Add logo if it loads successfully
    img.onload = function() {
      const imgWidth = 30;
      const imgHeight = (img.height * imgWidth) / img.width;
      doc.addImage(img, 'PNG', 10, 10, imgWidth, imgHeight);
      
      // Save PDF after image loads
      const filename = `statistiques_${membre.prenom}_${membre.nom}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
      doc.save(filename.toLowerCase().replace(/ /g, '_'));
    };
    
    // Set a timeout to save PDF even if image doesn't load
    setTimeout(() => {
      const filename = `statistiques_${membre.prenom}_${membre.nom}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
      doc.save(filename.toLowerCase().replace(/ /g, '_'));
    }, 500);
  } catch (error) {
    console.error("Error loading logo:", error);
    // Save PDF even if there's an error with the logo
    const filename = `statistiques_${membre.prenom}_${membre.nom}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(filename.toLowerCase().replace(/ /g, '_'));
  }
};
