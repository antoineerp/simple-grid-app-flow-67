
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createAndDownloadPdf } from './pdfManager';
import { Membre } from '@/types/membres';

/**
 * Exports collaborator statistics to PDF format
 */
export const exportCollaborateurStatsToPdf = (membre: Membre) => {
  const title = `Statistiques_${membre.prenom}_${membre.nom}`;
  
  createAndDownloadPdf((doc, startY) => {
    console.log("Génération du PDF pour:", membre.prenom, membre.nom);
    
    // Prepare title
    const displayTitle = `Statistiques de ${membre.prenom} ${membre.nom} (${membre.initiales})`;
    
    // Add role - Centered
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(14);
    doc.text(`Fonction: ${membre.fonction}`, pageWidth / 2, startY, { align: 'center' });
    
    // Table for member details
    doc.setFontSize(12);
    doc.text('Informations du membre', pageWidth / 2, startY + 15, { align: 'center' });
    
    const headersMembre = [['Champ', 'Valeur']];
    const dataMembre = [
      ['Nom', membre.nom],
      ['Prénom', membre.prenom],
      ['Fonction', membre.fonction],
      ['Initiales', membre.initiales],
      ['Date de création', format(new Date(membre.date_creation), 'dd/MM/yyyy', { locale: fr })]
    ];
    
    // Utilisation de autoTable pour le tableau
    autoTable(doc, {
      startY: startY + 20,
      head: headersMembre,
      body: dataMembre,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      tableWidth: 180,
      margin: { left: (pageWidth - 180) / 2 } // Center the table
    });
    
  }, title);
};

/**
 * Exports all collaborators to PDF format
 */
export const exportAllCollaborateursToPdf = (membres: Membre[]) => {
  const title = `Liste_des_collaborateurs`;
  
  createAndDownloadPdf((doc, startY) => {
    console.log("Génération du PDF pour tous les collaborateurs");
    
    // Add title - Centered
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.text(`Liste des collaborateurs`, pageWidth / 2, startY, { align: 'center' });
    
    // Table headers and data
    const headers = [['Nom', 'Prénom', 'Fonction', 'Initiales']];
    const data = membres.map(membre => [
      membre.nom,
      membre.prenom,
      membre.fonction,
      membre.initiales
    ]);
    
    // Add table of all members
    autoTable(doc, {
      startY: startY + 10,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] }
    });
    
  }, title);
};
