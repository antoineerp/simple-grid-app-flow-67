
import { Document, DocumentGroup } from '@/types/collaboration';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getCurrentUser } from '@/services/auth/authService';

export const exportCollaborationDocsToPdf = (documents: Document[], groups: DocumentGroup[]) => {
  const pdf = new jsPDF();
  const user = getCurrentUser();
  const timestamp = new Date().toLocaleString();
  
  // Titre
  pdf.setFontSize(18);
  pdf.setTextColor(33, 150, 243); // Bleu app
  pdf.text('Registre des Documents de Collaboration', 14, 20);
  
  // Sous-titre
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100); // Gris
  pdf.text(`Généré le ${timestamp} par ${user || 'Utilisateur non identifié'}`, 14, 30);
  
  // Créer un tableau avec tous les documents
  const allDocuments = [
    ...documents,
    ...groups.flatMap(group => 
      group.items.map(item => ({
        ...item,
        groupe: group.name
      }))
    )
  ];
  
  // Fonction pour formater la date
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return '-';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString();
    } catch (e) {
      return '-';
    }
  };
  
  // Tableau des documents
  autoTable(pdf, {
    startY: 40,
    head: [['Nom', 'Groupe', 'Description', 'URL', 'Date de création']],
    body: allDocuments.map(doc => [
      doc.titre || '-',
      doc.groupe || '-',
      doc.description || '-',
      doc.url || '-',
      formatDate(doc.date_creation)
    ]),
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    }
  });
  
  // Ajouter les statistiques
  const finalY = (pdf as any).lastAutoTable.finalY || 40;
  
  pdf.setFontSize(14);
  pdf.setTextColor(33, 150, 243); // Bleu app
  pdf.text('Statistiques', 14, finalY + 20);
  
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100); // Gris
  pdf.text(`Nombre total de documents: ${allDocuments.length}`, 14, finalY + 30);
  pdf.text(`Nombre de groupes: ${groups.length}`, 14, finalY + 40);
  
  // Enregistrer le PDF
  pdf.save('collaboration-documents.pdf');
};
