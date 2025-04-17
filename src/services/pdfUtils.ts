
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Shared utility functions for PDF exports

/**
 * Gets the current logo from localStorage or returns default
 */
export const getCurrentLogo = (): string => {
  const savedLogo = localStorage.getItem('appLogo');
  return savedLogo || "/lovable-uploads/4425c340-2ce3-416b-abc9-b75906ca8705.png";
};

/**
 * Formats the conformity state to human-readable text
 */
export const formatState = (state: string | null | boolean): string => {
  if (state === 'NC') return 'Non Conforme';
  if (state === 'PC') return 'Partiellement Conforme';
  if (state === 'C') return 'Conforme';
  if (state === 'EX' || state === true) return 'Exclusion';
  return 'Non défini';
};

/**
 * Formats RACI responsibilities into a human-readable string
 */
export const formatResponsabilities = (responsabilites: { r: string[], a: string[], c: string[], i: string[] }): string => {
  let result = '';
  if (responsabilites.r.length > 0) result += `R: ${responsabilites.r.join(', ')} `;
  if (responsabilites.a.length > 0) result += `A: ${responsabilites.a.join(', ')} `;
  if (responsabilites.c.length > 0) result += `C: ${responsabilites.c.join(', ')} `;
  if (responsabilites.i.length > 0) result += `I: ${responsabilites.i.join(', ')}`;
  return result.trim();
};

/**
 * Initializes a new PDF document with common header elements
 */
export const initializePdf = (title: string): { doc: jsPDF, currentDate: string } => {
  // Import jspdf-autotable to extend jsPDF
  require('jspdf-autotable');
  
  const doc = new jsPDF();
  const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  
  // Load logo
  const logoPath = getCurrentLogo();
  const img = new Image();
  img.src = logoPath;
  
  return { doc, currentDate };
};

/**
 * Adds header with logo and title to the PDF
 */
export const addPdfHeader = (doc: jsPDF, img: HTMLImageElement, title: string, currentDate: string): void => {
  const imgWidth = 30;
  const imgHeight = (img.height * imgWidth) / img.width;
  
  doc.addImage(img, 'PNG', 10, 10, imgWidth, imgHeight);
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 50, 20);
  
  // Add generation date
  doc.setFontSize(10);
  doc.text(`Généré le: ${currentDate}`, 10, 40);
};

/**
 * Generate standardized filename for PDF exports
 */
export const generateFilename = (baseName: string): string => {
  return `${baseName.toLowerCase().replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
};
