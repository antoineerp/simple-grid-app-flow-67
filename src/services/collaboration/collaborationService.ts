
/**
 * Service pour la gestion de la collaboration
 */
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

/**
 * Charge les données de collaboration depuis le stockage local
 */
export const loadCollaborationFromStorage = (): { documents: Document[], groups: DocumentGroup[] } => {
  try {
    const userId = getCurrentUser() || 'p71x6d_system';
    const documentsKey = `collaboration_${userId}`;
    const groupsKey = `collaboration-groups_${userId}`;
    
    // Charger les documents
    const storedDocuments = localStorage.getItem(documentsKey);
    const documents = storedDocuments ? JSON.parse(storedDocuments) : [];
    
    // Charger les groupes
    const storedGroups = localStorage.getItem(groupsKey);
    const groups = storedGroups ? JSON.parse(storedGroups) : [];
    
    console.log(`collaborationService: Chargement local - ${documents.length} documents, ${groups.length} groupes`);
    
    return { documents, groups };
  } catch (error) {
    console.error('collaborationService: Erreur lors du chargement local:', error);
    return { documents: [], groups: [] };
  }
};

/**
 * Sauvegarde les données de collaboration dans le stockage local
 */
export const saveCollaborationToStorage = (documents: Document[], groups: DocumentGroup[]): void => {
  try {
    const userId = getCurrentUser() || 'p71x6d_system';
    const documentsKey = `collaboration_${userId}`;
    const groupsKey = `collaboration-groups_${userId}`;
    
    // Sauvegarder les documents
    localStorage.setItem(documentsKey, JSON.stringify(documents));
    
    // Sauvegarder les groupes
    localStorage.setItem(groupsKey, JSON.stringify(groups));
    
    console.log(`collaborationService: Sauvegarde locale - ${documents.length} documents, ${groups.length} groupes`);
  } catch (error) {
    console.error('collaborationService: Erreur lors de la sauvegarde locale:', error);
  }
};

/**
 * Nettoie les données de synchronisation en attente
 */
export const clearPendingSyncFlags = (entityNames: string[] = ['collaboration', 'collaboration-groups']): void => {
  entityNames.forEach(entityName => {
    try {
      localStorage.removeItem(`sync_pending_${entityName}`);
      console.log(`collaborationService: Marqueur de synchronisation effacé pour ${entityName}`);
    } catch (error) {
      console.error(`collaborationService: Erreur lors du nettoyage des marqueurs pour ${entityName}:`, error);
    }
  });
};

/**
 * Convertit les documents plats en structure hiérarchique avec groupes
 */
export const organizeDocumentsInGroups = (
  allDocuments: Document[]
): { documents: Document[], groups: DocumentGroup[] } => {
  try {
    // Séparer les documents des groupes
    const nonGroupedDocs = allDocuments.filter(doc => !doc.groupId);
    const groupedDocs = allDocuments.filter(doc => doc.groupId);
    
    // Créer une map des groupes uniques
    const groupMap = new Map<string, DocumentGroup>();
    
    // Regrouper les documents par groupe
    groupedDocs.forEach(doc => {
      if (doc.groupId) {
        if (!groupMap.has(doc.groupId)) {
          // Créer un nouveau groupe
          groupMap.set(doc.groupId, {
            id: doc.groupId,
            name: `Groupe ${doc.groupId}`,
            expanded: false,
            items: []
          });
        }
        
        // Ajouter le document au groupe
        const group = groupMap.get(doc.groupId);
        if (group) {
          group.items.push(doc);
        }
      }
    });
    
    // Convertir la map en array de groupes
    const groups = Array.from(groupMap.values());
    
    return { documents: nonGroupedDocs, groups };
  } catch (error) {
    console.error('collaborationService: Erreur lors de l\'organisation des documents:', error);
    return { documents: [], groups: [] };
  }
};
