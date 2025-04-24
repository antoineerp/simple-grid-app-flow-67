
import { Document } from '@/types/documents';

export const loadDocumentsFromStorage = (currentUser: string): Document[] => {
  console.log(`Chargement des documents pour l'utilisateur: ${currentUser}`);
  const storageKey = `documents_${currentUser}`;
  const storedDocuments = localStorage.getItem(storageKey);
  
  if (storedDocuments) {
    console.log(`Documents trouvés pour ${currentUser}`);
    return JSON.parse(storedDocuments);
  } else {
    console.log(`Aucun document existant pour ${currentUser}, chargement du template`);
    const defaultDocuments = localStorage.getItem('documents_template') || localStorage.getItem('documents');
    
    if (defaultDocuments) {
      console.log('Utilisation du template de documents');
      return JSON.parse(defaultDocuments);
    }
    
    console.log('Création de documents par défaut');
    return [
      { 
        id: '1', 
        nom: 'Manuel qualité', 
        fichier_path: null,
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: null,
        date_creation: new Date(),
        date_modification: new Date()
      },
      { 
        id: '2', 
        nom: 'Processus opérationnel', 
        fichier_path: null,
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: null,
        date_creation: new Date(),
        date_modification: new Date()
      },
    ];
  }
};

export const saveDocumentsToStorage = (documents: Document[], currentUser: string): void => {
  console.log(`Sauvegarde des documents pour l'utilisateur: ${currentUser}`);
  const storageKey = `documents_${currentUser}`;
  localStorage.setItem(storageKey, JSON.stringify(documents));
  
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin' || userRole === 'administrateur') {
    console.log('Sauvegarde du template de documents (utilisateur admin)');
    localStorage.setItem('documents_template', JSON.stringify(documents));
  }
  
  window.dispatchEvent(new Event('documentUpdate'));
};

/**
 * Legacy calculate document statistics function (kept for backward compatibility)
 * @deprecated Use the version from documentStatsService instead
 */
export const calculateDocumentStats = (documents: Document[]) => {
  const totalDocuments = documents.length;
  const excluded = documents.filter(doc => doc.etat === 'EX').length;
  const nonExcluded = totalDocuments - excluded;
  
  return {
    total: totalDocuments,
    excluded,
    nonExcluded,
    nonConforme: documents.filter(doc => doc.etat === 'NC').length,
    partiellementConforme: documents.filter(doc => doc.etat === 'PC').length,
    conforme: documents.filter(doc => doc.etat === 'C').length,
    // Add exclusion property to match the expected type
    exclusion: excluded
  };
};
