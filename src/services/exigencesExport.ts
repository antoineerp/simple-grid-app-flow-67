
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  formatState, 
  formatResponsabilities,
  createAndDownloadPdf
} from './pdfManager';

export const exportExigencesToPdf = (exigences: any[], title: string = 'Liste des exigences') => {
  createAndDownloadPdf((doc, startY) => {
    // Définir la structure du tableau
    const headers = [['Nom', 'Responsabilités', 'État']];
    
    // Préparer les données
    const data = exigences.map(exigence => [
      exigence.nom,
      formatResponsabilities(exigence.responsabilites),
      exigence.exclusion ? 'Exclusion' : formatState(exigence.atteinte)
    ]);
    
    // Générer le tableau avec autoTable
    autoTable(doc, {
      startY: startY,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 70 },
        2: { cellWidth: 50 }
      }
    });
    
    console.log(`Tableau d'exigences généré avec ${data.length} lignes`);
  }, title);
};
