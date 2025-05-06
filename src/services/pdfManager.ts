import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Unified PDF generation manager to ensure consistent functionality
 * across all PDF exports in the application
 */

// Get the current logo from localStorage or return default
export const getCurrentLogo = (): string => {
  const storedLogo = localStorage.getItem('pdfLogo');
  console.log('Logo stocké :', storedLogo ? storedLogo.substring(0, 50) + '...' : 'Pas de logo');
  return storedLogo || "/lovable-uploads/formacert-logo.png";
};

// Format state to human-readable text
export const formatState = (state: string | null | boolean): string => {
  if (state === 'NC') return 'Non Conforme';
  if (state === 'PC') return 'Partiellement Conforme';
  if (state === 'C') return 'Conforme';
  if (state === 'EX' || state === true) return 'Exclusion';
  return 'Non défini';
};

// Format responsibilities into a human-readable string
export const formatResponsabilities = (responsabilites: { r: string[], a: string[], c: string[], i: string[] }): string => {
  let result = '';
  if (responsabilites.r.length > 0) result += `R: ${responsabilites.r.join(', ')} `;
  if (responsabilites.a.length > 0) result += `A: ${responsabilites.a.join(', ')} `;
  if (responsabilites.c.length > 0) result += `C: ${responsabilites.c.join(', ')} `;
  if (responsabilites.i.length > 0) result += `I: ${responsabilites.i.join(', ')}`;
  return result.trim();
};

const addStandardHeader = (doc: jsPDF, title: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  
  // Add FormaCert logo
  try {
    doc.addImage("/lovable-uploads/formacert-logo.png", 'PNG', 15, 10, 25, 25);
  } catch (error) {
    console.error("Erreur lors de l'ajout du logo:", error);
  }
  
  // Add title - Centered
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, 25, { align: 'center' });
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Généré le: ${currentDate}`, pageWidth / 2, 35, { align: 'center' });
  
  // Add separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 40, pageWidth - 15, 40);
  
  return 45; // Return Y position after header
};

// Generate standardized filename
export const generateFilename = (baseName: string): string => {
  return `${baseName.toLowerCase().replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
};

/**
 * Core function to create and download a PDF document
 * This function guarantees the PDF will be downloaded regardless of image loading issues
 */
export const createAndDownloadPdf = (
  callback: (doc: jsPDF, startY: number) => void,
  filename: string
): void => {
  console.log("Début de la création du PDF:", filename);
  const doc = new jsPDF();
  
  try {
    const startY = addStandardHeader(doc, filename);
    callback(doc, startY);
    
    console.log("Sauvegarde du PDF:", generateFilename(filename));
    doc.save(generateFilename(filename));
    console.log("PDF sauvegardé avec succès");
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    try {
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      console.log("PDF ouvert dans une nouvelle fenêtre");
    } catch (finalError) {
      console.error("Échec de la génération du PDF:", finalError);
    }
  }
};
