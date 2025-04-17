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
  return savedLogo || "/lovable-uploads/aba57440-1db2-49ba-8273-c60d6a77b6ee.png";
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
  // Create new PDF document
  const doc = new jsPDF();
  
  // Current date for the document
  const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  
  // Add logo to document
  try {
    // Try to load logo
    const logoPath = getCurrentLogo();
    const img = new Image();
    img.src = logoPath;
    
    // Set up image load event
    img.onload = () => {
      try {
        // Add logo to PDF
        const imgWidth = 30;
        const imgHeight = (img.height * imgWidth) / img.width;
        doc.addImage(img, 'PNG', 10, 10, imgWidth, imgHeight);
      } catch (error) {
        console.error("Error adding logo to PDF:", error);
      } finally {
        // Always continue with document generation
        finalizePdf();
      }
    };
    
    // Handle image load errors
    img.onerror = () => {
      console.error("Error loading logo image");
      finalizePdf();
    };
    
    // Set timeout to ensure PDF generation even if image loading hangs
    const timeoutId = setTimeout(finalizePdf, 500);
    
    // Function to complete PDF and download it
    function finalizePdf() {
      clearTimeout(timeoutId); // Clear timeout if it hasn't fired yet
      
      // Continue with PDF generation using callback
      try {
        callback(doc);
      } catch (error) {
        console.error("Error during PDF generation:", error);
      }
      
      // Save PDF - ensure this always executes
      try {
        doc.save(generateFilename(filename));
      } catch (error) {
        console.error("Error saving PDF:", error);
        // Last resort - try to open in new window
        try {
          const pdfBlob = doc.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          window.open(pdfUrl, '_blank');
        } catch (finalError) {
          console.error("Failed to generate PDF in any way:", finalError);
        }
      }
    }
  } catch (error) {
    console.error("Initial PDF creation error:", error);
    // Attempt PDF generation without logo
    try {
      callback(doc);
      doc.save(generateFilename(filename));
    } catch (finalError) {
      console.error("Failed to generate PDF without logo:", finalError);
    }
  }
  
  return;
};
