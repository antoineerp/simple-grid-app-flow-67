
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document } from '@/types/documents';
import { 
  formatState, 
  formatResponsabilities,
  createAndDownloadPdf
} from './pdfManager';

export const exportDocumentsToPdf = (documents: Document[], groups: any[] = [], title: string = 'Gestion Documentaire') => {
  createAndDownloadPdf((doc, startY) => {
    let currentY = startY;
    
    // Pour chaque groupe
    groups.forEach(group => {
      // Ajouter le titre du groupe
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(group.name, 15, currentY);
      currentY += 10;
      
      // Trouver les documents du groupe
      const groupDocs = documents.filter(doc => doc.groupId === group.id);
      
      if (groupDocs.length > 0) {
        // Générer le tableau pour ce groupe
        autoTable(doc, {
          startY: currentY,
          head: [['Nom', 'Lien', 'Responsabilités', 'État']],
          body: groupDocs.map(doc => [
            doc.nom,
            doc.fichier_path || '-',
            formatResponsabilities(doc.responsabilites),
            // Vérifier si la propriété 'exclusion' existe avant de l'utiliser
            doc.etat === 'EX' ? 'Exclusion' : formatState(doc.etat)
          ]),
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
        
        // Mettre à jour la position Y
        currentY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        // Si aucun document dans ce groupe, indiquer que le groupe est vide
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('(Aucun document dans ce groupe)', 20, currentY);
        currentY += 15;
      }
    });
    
    // Documents non groupés
    const ungroupedDocs = documents.filter(d => !d.groupId);
    if (ungroupedDocs.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Documents non groupés', 15, currentY);
      currentY += 10;
      
      autoTable(doc, {
        startY: currentY,
        head: [['Nom', 'Lien', 'Responsabilités', 'État']],
        body: ungroupedDocs.map(doc => [
          doc.nom,
          doc.fichier_path || '-',
          formatResponsabilities(doc.responsabilites),
          // Vérifier si la propriété 'exclusion' existe avant de l'utiliser
          doc.etat === 'EX' ? 'Exclusion' : formatState(doc.etat)
        ]),
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
    }
    
    console.log(`PDF de documents généré avec ${documents.length} documents`);
  }, title);
};
