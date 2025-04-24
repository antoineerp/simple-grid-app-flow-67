
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Unified PDF generation manager to ensure consistent functionality
 * across all PDF exports in the application
 */

// Get the current logo from localStorage or return default
export const getCurrentLogo = (): string => {
  const savedLogo = localStorage.getItem('appLogo');
  return savedLogo || "/lovable-uploads/4c7adb52-3da0-4757-acbf-50a1eb1d4bf5.png";
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

// Generate standardized filename
export const generateFilename = (baseName: string): string => {
  return `${baseName.toLowerCase().replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
};

/**
 * Core function to create and download a PDF document
 * This function guarantees the PDF will be downloaded regardless of image loading issues
 */
export const createAndDownloadPdf = (
  callback: (doc: jsPDF) => void,
  filename: string
): void => {
  console.log("Début de la création du PDF:", filename);
  // Create new PDF document
  const doc = new jsPDF();
  
  // Logging pour débogage
  console.log("Document PDF créé");
  
  try {
    // Exécuter directement la génération du contenu
    console.log("Exécution du callback pour générer le contenu");
    callback(doc);
    console.log("Contenu généré avec succès");
    
    // Sauvegarder le PDF
    console.log("Sauvegarde du PDF:", generateFilename(filename));
    doc.save(generateFilename(filename));
    console.log("PDF sauvegardé avec succès");
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    // En cas d'erreur, tenter d'ouvrir le PDF dans une nouvelle fenêtre
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
