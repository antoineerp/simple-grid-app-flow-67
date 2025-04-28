
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  formatState, 
  formatResponsabilities,
  createAndDownloadPdf
} from './pdfManager';

export const exportExigencesToPdf = (exigences: any[], groups: any[] = [], title: string = 'Liste des exigences') => {
  createAndDownloadPdf((doc, startY) => {
    let currentY = startY;
    
    // Pour chaque groupe
    groups.forEach(group => {
      // Ajouter le titre du groupe
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(group.name, 15, currentY);
      currentY += 10;
      
      // Trouver les exigences du groupe
      const groupExigences = group.items || [];
      
      if (groupExigences.length > 0) {
        // Générer le tableau pour ce groupe
        autoTable(doc, {
          startY: currentY,
          head: [['Nom', 'Responsabilités', 'État']],
          body: groupExigences.map(exigence => [
            exigence.nom,
            formatResponsabilities(exigence.responsabilites),
            exigence.exclusion ? 'Exclusion' : formatState(exigence.atteinte)
          ]),
          theme: 'grid',
          styles: { fontSize: 10, cellPadding: 5 },
          headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 70 },
            2: { cellWidth: 50 }
          }
        });
        
        // Mettre à jour la position Y
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
    });
    
    // Exigences non groupées
    const ungroupedExigences = exigences.filter(e => !e.groupId);
    if (ungroupedExigences.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Exigences non groupées', 15, currentY);
      currentY += 10;
      
      autoTable(doc, {
        startY: currentY,
        head: [['Nom', 'Responsabilités', 'État']],
        body: ungroupedExigences.map(exigence => [
          exigence.nom,
          formatResponsabilities(exigence.responsabilites),
          exigence.exclusion ? 'Exclusion' : formatState(exigence.atteinte)
        ]),
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 70 },
          2: { cellWidth: 50 }
        }
      });
    }
    
    console.log(`PDF d'exigences généré avec ${exigences.length} éléments`);
  }, title);
};
