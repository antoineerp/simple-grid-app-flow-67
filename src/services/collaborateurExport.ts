
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
  
  // Utiliser une callback synchrone pour garantir l'exécution complète
  createAndDownloadPdf((doc) => {
    console.log("Génération du PDF pour:", membre.prenom, membre.nom);
    
    // Date de génération
    const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
    
    // Prepare title
    const displayTitle = `Statistiques de ${membre.prenom} ${membre.nom} (${membre.initiales})`;
    
    // Add title and metadata - Centered
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.text(displayTitle, pageWidth / 2, 20, { align: 'center' });
    
    // Add role - Centered
    doc.setFontSize(14);
    doc.text(`Fonction: ${membre.fonction}`, pageWidth / 2, 30, { align: 'center' });
    
    // Add date - Centered
    doc.setFontSize(10);
    doc.text(`Généré le: ${currentDate}`, pageWidth / 2, 40, { align: 'center' });
    
    // Pour déboguer - tracer une ligne
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 45, pageWidth - 10, 45);
    
    // Table for requirements statistics
    doc.setFontSize(12);
    doc.text('Statistiques des exigences', pageWidth / 2, 55, { align: 'center' });
    
    const headersExigences = [['Type', 'Nombre']];
    const dataExigences = [
      ['Responsable (R)', membre.exigences.r],
      ['Approbateur (A)', membre.exigences.a],
      ['Consulté (C)', membre.exigences.c],
      ['Informé (I)', membre.exigences.i],
      ['Total', membre.exigences.r + membre.exigences.a + membre.exigences.c + membre.exigences.i]
    ];
    
    try {
      // Utilisation explicite de autoTable (importé de jspdf-autotable)
      autoTable(doc, {
        startY: 60,
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
      
      // Utilisation explicite de autoTable pour le second tableau
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
      
      // Ajouter des informations de version
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Version du PDF: 1.0.2`, 15, doc.internal.pageSize.getHeight() - 10);
      
    } catch (error) {
      console.error("Erreur lors de la génération du tableau:", error);
      // En cas d'erreur, ajouter un message dans le PDF
      doc.setTextColor(255, 0, 0);
      doc.setFontSize(12);
      doc.text("Erreur lors de la génération des tableaux. Veuillez réessayer.", 20, 120);
    }
  }, title);
};
