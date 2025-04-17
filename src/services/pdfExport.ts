
// Main export file that re-exports all PDF functionality

// Export utility functions
export { 
  formatState, 
  formatResponsabilities,
  getCurrentLogo,
  generateFilename
} from './pdfManager';

// Export exigences PDF generation
export { exportExigencesToPdf } from './exigencesExport';

// Export documents PDF generation
export { exportDocumentsToPdf } from './documentsExport';

// Export collaborateur stats PDF generation
export { exportCollaborateurStatsToPdf } from './collaborateurExport';

// Export pilotage documents to PDF format
export { exportPilotageToOdf } from './pilotageExport';

// Export bibliothèque documents to PDF format
export { exportBibliothecaireDocsToPdf } from './bibliothequeExport';
