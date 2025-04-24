
import jsPDF from 'jspdf';
import { 
  createAndDownloadPdf
} from './pdfManager';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'jspdf-autotable';

/**
 * Exports collaborator statistics to PDF format
 */
export const exportCollaborateurStatsToPdf = (membre: any) => {
  const title = `Statistiques_${membre.prenom}_${membre.nom}`;

  createAndDownloadPdf((doc) => {
    // Date de génération
    const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
    
    // Prepare title
    const displayTitle = `Statistiques de ${membre.prenom} ${membre.nom} (${membre.initiales})`;
    
    // Add title and metadata - Now centered
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.text(displayTitle, pageWidth / 2, 20, { align: 'center' });
    
    // Add role - Now centered
    doc.setFontSize(14);
    doc.text(`Fonction: ${membre.fonction}`, pageWidth / 2, 30, { align: 'center' });
    
    // Add date - Now centered
    doc.setFontSize(10);
    doc.text(`Généré le: ${currentDate}`, pageWidth / 2, 40, { align: 'center' });
    
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
      tableWidth: 150,
      margin: { left: (pageWidth - 150) / 2 } // Center the table
    });
    
    // Title for documents
    doc.setFontSize(14);
    let lastPosition = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Documents', pageWidth / 2, lastPosition, { align: 'center' });
    
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
      startY: lastPosition + 5,
      head: headersDocuments,
      body: dataDocuments,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      tableWidth: 150,
      margin: { left: (pageWidth - 150) / 2 } // Center the table
    });
    
    // Total
    const totalGeneral = 
      membre.exigences.r + membre.exigences.a + membre.exigences.c + membre.exigences.i +
      membre.documents.r + membre.documents.a + membre.documents.c + membre.documents.i;
    
    lastPosition = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text(`Total des responsabilités: ${totalGeneral}`, pageWidth / 2, lastPosition, { align: 'center' });
  }, title);
};
