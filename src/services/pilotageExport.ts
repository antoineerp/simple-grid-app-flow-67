
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  getCurrentLogo, 
  formatState, 
  generateFilename 
} from './pdfUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Exports pilotage documents to PDF format (formerly ODF)
 */
export const exportPilotageToOdf = (documents: any[], title: string = 'Documents de pilotage') => {
  // Create a new PDF document
  const doc = new jsPDF();
  const logoPath = getCurrentLogo();
  
  // Date de génération
  const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  
  // Add title and date immediately (don't wait for image)
  doc.setFontSize(18);
  doc.text(title, 50, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Généré le: ${currentDate}`, 10, 40);
  
  // Define columns for the table
  const headers = [['Ordre', 'Nom du document', 'Lien']];
  
  // Convert data for the table
  const data = documents.map(doc => [
    doc.ordre,
    doc.nom,
    doc.lien || '-'
  ]);
  
  // Generate the table
  (doc as any).autoTable({
    startY: 45,
    head: headers,
    body: data,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 100 },
      2: { cellWidth: 70 }
    }
  });
  
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
      doc.save(generateFilename('Documents_Pilotage'));
    };
    
    // Set a timeout to save PDF even if image doesn't load
    setTimeout(() => {
      doc.save(generateFilename('Documents_Pilotage'));
    }, 500);
  } catch (error) {
    console.error("Error loading logo:", error);
    // Save PDF even if there's an error with the logo
    doc.save(generateFilename('Documents_Pilotage'));
  }
};
