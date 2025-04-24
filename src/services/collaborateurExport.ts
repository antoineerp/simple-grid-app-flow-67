
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createAndDownloadPdf } from './pdfManager';

/**
 * Exports collaborator statistics to PDF format
 */
export const exportCollaborateurStatsToPdf = (membre: any) => {
  const title = `Statistiques_${membre.prenom}_${membre.nom}`;
  
  createAndDownloadPdf((doc, startY) => {
    console.log("Génération du PDF pour:", membre.prenom, membre.nom);
    
    // Prepare title
    const displayTitle = `Statistiques de ${membre.prenom} ${membre.nom} (${membre.initiales})`;
    
    // Add role - Centered
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(14);
    doc.text(`Fonction: ${membre.fonction}`, pageWidth / 2, startY, { align: 'center' });
    
    // Table for requirements statistics
    doc.setFontSize(12);
    doc.text('Statistiques des exigences', pageWidth / 2, startY + 15, { align: 'center' });
    
    const headersExigences = [['Type', 'Nombre']];
    const dataExigences = [
      ['Responsable (R)', membre.exigences.r],
      ['Approbateur (A)', membre.exigences.a],
      ['Consulté (C)', membre.exigences.c],
      ['Informé (I)', membre.exigences.i],
      ['Total', membre.exigences.r + membre.exigences.a + membre.exigences.c + membre.exigences.i]
    ];
    
    // Utilisation de autoTable pour le premier tableau
    autoTable(doc, {
      startY: startY + 20,
      head: headersExigences,
      body: dataExigences,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      tableWidth: 150,
      margin: { left: (pageWidth - 150) / 2 } // Center the table
    });
    
    // Récupérer la position finale du tableau
    const lastPosition = (doc as any).lastAutoTable?.finalY || 120;
    
    // Title for documents
    doc.setFontSize(14);
    doc.text('Documents', pageWidth / 2, lastPosition + 15, { align: 'center' });
    
    // Table for document statistics
    const headersDocuments = [['Type', 'Nombre']];
    const dataDocuments = [
      ['Responsable (R)', membre.documents.r],
      ['Approbateur (A)', membre.documents.a],
      ['Consulté (C)', membre.documents.c],
      ['Informé (I)', membre.documents.i],
      ['Total', membre.documents.r + membre.documents.a + membre.documents.c + membre.documents.i]
    ];
    
    // Utilisation de autoTable pour le second tableau
    autoTable(doc, {
      startY: lastPosition + 20,
      head: headersDocuments,
      body: dataDocuments,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      tableWidth: 150,
      margin: { left: (pageWidth - 150) / 2 } // Center the table
    });
    
    // Récupérer la position finale du second tableau
    const finalPosition = (doc as any).lastAutoTable?.finalY || 180;
    
    // Total
    const totalGeneral = 
      membre.exigences.r + membre.exigences.a + membre.exigences.c + membre.exigences.i +
      membre.documents.r + membre.documents.a + membre.documents.c + membre.documents.i;
    
    doc.setFontSize(14);
    doc.text(`Total des responsabilités: ${totalGeneral}`, pageWidth / 2, finalPosition + 15, { align: 'center' });
    
  }, title);
};
