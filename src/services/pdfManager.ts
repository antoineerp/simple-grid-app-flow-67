
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getApiUrl } from '@/config/apiConfig';

/**
 * Unified PDF generation manager to ensure consistent functionality
 * across all PDF exports in the application
 */

// Récupère le logo actuel depuis la configuration globale ou utilise celui du localStorage en secours
export const getCurrentLogo = async (): Promise<string> => {
  try {
    console.log("Récupération du logo depuis la configuration globale...");
    // D'abord essayer de récupérer depuis la configuration globale
    const url = `${getApiUrl()}/controllers/GlobalConfigController.php?key=pdfLogo`;
    console.log("URL de requête:", url);
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    console.log("Statut de la réponse:", response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    console.log("Content-Type:", contentType);
    
    const data = await response.json();
    console.log("Données reçues:", data);
    
    if (data.status === 'success' && data.data?.value) {
      console.log("Logo trouvé dans la configuration globale");
      // Mettre à jour le localStorage pour une utilisation future
      localStorage.setItem('pdfLogo', data.data.value);
      return data.data.value;
    } else {
      console.log("Logo non trouvé dans la configuration globale");
      throw new Error("Logo non trouvé dans la configuration globale");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du logo depuis la configuration globale:", error);
    console.log("Utilisation du logo depuis le localStorage ou du logo par défaut");
    // Fallback sur localStorage ou logo par défaut
    const localLogo = localStorage.getItem('pdfLogo');
    return localLogo || "/lovable-uploads/formacert-logo.png";
  }
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

const addStandardHeader = async (doc: jsPDF, title: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDate = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  
  // Add FormaCert logo from global config
  try {
    console.log("Ajout du logo au PDF...");
    const logoUrl = await getCurrentLogo();
    console.log("Logo à utiliser:", logoUrl);
    
    // Vérifier si le logo est une URL complète ou une URL data
    if (logoUrl.startsWith('data:image')) {
      console.log("Ajout d'une image data:URL au PDF");
      doc.addImage(logoUrl, 'AUTO', 15, 10, 25, 25);
    } else {
      console.log("Ajout d'une image par URL au PDF");
      doc.addImage(logoUrl, 'AUTO', 15, 10, 25, 25);
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout du logo:", error);
    // Fallback to default logo if error
    try {
      console.log("Tentative d'utiliser le logo par défaut");
      doc.addImage("/lovable-uploads/formacert-logo.png", 'PNG', 15, 10, 25, 25);
    } catch (secondError) {
      console.error("Erreur lors de l'ajout du logo par défaut:", secondError);
    }
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
  
  Promise.resolve(addStandardHeader(doc, filename))
    .then(startY => {
      callback(doc, startY);
      
      console.log("Sauvegarde du PDF:", generateFilename(filename));
      doc.save(generateFilename(filename));
      console.log("PDF sauvegardé avec succès");
    })
    .catch(error => {
      console.error("Erreur lors de la génération du PDF:", error);
      try {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        console.log("PDF ouvert dans une nouvelle fenêtre");
      } catch (finalError) {
        console.error("Échec de la génération du PDF:", finalError);
      }
    });
};
