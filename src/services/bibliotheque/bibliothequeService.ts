
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { syncService } from '@/services/core/syncService';

/**
 * Loads collaboration documents from the server for a specific user
 */
export const loadBibliothequeFromServer = async (currentUser: string): Promise<{ documents: Document[], groups: DocumentGroup[] }> => {
  try {
    // Utiliser le service de synchronisation pour charger les données
    const data = await syncService.loadDataFromServer<any>('bibliotheque', currentUser);
    
    if (!data || !Array.isArray(data)) {
      console.log(`Aucune donnée bibliothèque trouvée pour l'utilisateur ${currentUser}, utilisation des données par défaut`);
      return loadDefaultData(currentUser);
    }
    
    // Séparer les documents et les groupes
    const documents = data.filter(item => item.type === 'document' || !item.type) as Document[];
    const groups = data.filter(item => item.type === 'group') as DocumentGroup[];
    
    console.log(`Chargé ${documents.length} documents et ${groups.length} groupes pour l'utilisateur ${currentUser} depuis le serveur`);
    
    // S'assurer que tous les documents ont l'userId correct
    const updatedDocuments = documents.map(doc => ({
      ...doc,
      userId: currentUser
    }));
    
    // S'assurer que tous les groupes ont l'userId correct
    const updatedGroups = groups.map(group => ({
      ...group,
      userId: currentUser,
      items: []
    }));
    
    // Associer les documents aux groupes
    updatedGroups.forEach(group => {
      group.items = updatedDocuments
        .filter(doc => doc.groupId === group.id)
        .map(doc => ({ ...doc, userId: currentUser }));
    });
    
    // Retirer les documents déjà associés à des groupes
    const standaloneDocuments = updatedDocuments.filter(doc => !doc.groupId);
    
    return { 
      documents: standaloneDocuments, 
      groups: updatedGroups 
    };
  } catch (error) {
    console.error("Erreur lors du chargement depuis le serveur:", error);
    return loadFromStorage(currentUser);
  }
};

/**
 * Loads collaboration documents from localStorage for a specific user (fallback)
 */
export const loadFromStorage = (currentUser: string): { documents: Document[], groups: DocumentGroup[] } => {
  const storedDocuments = localStorage.getItem(`collaboration_documents_${currentUser}`);
  const storedGroups = localStorage.getItem(`collaboration_groups_${currentUser}`);
  
  let documents: Document[] = [];
  let groups: DocumentGroup[] = [];
  
  if (storedDocuments) {
    documents = JSON.parse(storedDocuments);
    console.log(`Chargé ${documents.length} documents depuis le localStorage pour l'utilisateur ${currentUser}`);
  } else {
    const { documents: defaultDocs } = loadDefaultData(currentUser);
    documents = defaultDocs;
  }
  
  if (storedGroups) {
    groups = JSON.parse(storedGroups);
    console.log(`Chargé ${groups.length} groupes depuis le localStorage pour l'utilisateur ${currentUser}`);
  } else {
    const { groups: defaultGroups } = loadDefaultData(currentUser);
    groups = defaultGroups;
  }
  
  // S'assurer que tous les documents ont l'userId correct
  documents = documents.map(doc => ({
    ...doc,
    userId: currentUser
  }));
  
  // S'assurer que tous les groupes ont l'userId correct
  groups = groups.map(group => ({
    ...group,
    userId: currentUser,
    // Associer les documents aux groupes
    items: documents.filter(doc => doc.groupId === group.id).map(doc => ({
      ...doc,
      userId: currentUser
    }))
  }));
  
  // Retirer les documents déjà associés à des groupes
  documents = documents.filter(doc => !doc.groupId);
  
  return { documents, groups };
};

/**
 * Génère des données par défaut pour un utilisateur
 */
const loadDefaultData = (currentUser: string): { documents: Document[], groups: DocumentGroup[] } => {
  const documents: Document[] = [
    { id: "1", name: 'Organigramme', link: 'Voir le document', userId: currentUser },
    { id: "2", name: 'Administration', link: 'Voir le document', userId: currentUser },
  ];
  
  const groups: DocumentGroup[] = [
    { id: "1", name: 'Documents organisationnels', expanded: false, items: [], userId: currentUser },
    { id: "2", name: 'Documents administratifs', expanded: false, items: [], userId: currentUser },
  ];
  
  console.log(`Créé des données par défaut pour l'utilisateur ${currentUser}`);
  
  return { documents, groups };
};

/**
 * Saves collaboration documents to the server for a specific user
 */
export const saveBibliothequeToServer = async (documents: Document[], groups: DocumentGroup[], currentUser: string): Promise<boolean> => {
  console.log(`Sauvegarde des documents pour l'utilisateur ${currentUser}`);
  
  try {
    // S'assurer que tous les documents ont l'userId correct
    const updatedDocuments = documents.map(doc => ({
      ...doc,
      userId: currentUser,
      type: 'document'
    }));
    
    // S'assurer que tous les groupes ont l'userId correct et extraire les items
    const groupItems: Document[] = [];
    
    const updatedGroups = groups.map(group => {
      // Collecter tous les documents dans ce groupe
      if (group.items && group.items.length > 0) {
        const itemsWithGroupId = group.items.map(item => ({
          ...item,
          userId: currentUser,
          groupId: group.id,
          type: 'document'
        }));
        groupItems.push(...itemsWithGroupId);
      }
      
      return {
        ...group,
        userId: currentUser,
        type: 'group',
        items: [] // On n'envoie pas les items imbriqués au serveur
      };
    });
    
    // Combiner tous les documents pour la sauvegarde
    const allDocuments = [...updatedDocuments, ...groupItems];
    
    // Sauvegarder les données sur le serveur
    const allData = [...updatedGroups, ...allDocuments];
    
    // Utiliser le service de synchronisation pour envoyer les données
    await syncService.sendDataToServer('bibliotheque', allData, currentUser);
    
    // Sauvegarder aussi dans le localStorage comme sauvegarde
    localStorage.setItem(`collaboration_documents_${currentUser}`, JSON.stringify(allDocuments));
    localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(updatedGroups));
    
    console.log(`Sauvegarde réussie: ${allDocuments.length} documents, ${updatedGroups.length} groupes pour ${currentUser}`);
    
    // Notifier sur la mise à jour de la bibliothèque
    window.dispatchEvent(new Event('collaborationUpdate'));
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde sur le serveur:", error);
    
    // Sauvegarder quand même dans le localStorage en cas d'erreur serveur
    saveBibliothequeToStorage(documents, groups, currentUser);
    
    return false;
  }
};

/**
 * Saves collaboration documents to localStorage for a specific user (fallback)
 */
export const saveBibliothequeToStorage = (documents: Document[], groups: DocumentGroup[], currentUser: string): void => {
  console.log(`Sauvegarde locale des documents pour l'utilisateur ${currentUser}`);
  
  // S'assurer que tous les documents ont l'userId correct
  const updatedDocuments = documents.map(doc => ({
    ...doc,
    userId: currentUser
  }));
  
  // S'assurer que tous les groupes ont l'userId correct
  const updatedGroups = groups.map(group => ({
    ...group,
    userId: currentUser,
    // Mettre à jour les userId des documents dans les groupes
    items: group.items.map(item => ({
      ...item,
      userId: currentUser,
      groupId: group.id
    }))
  }));
  
  // Extraction des documents des groupes
  const groupDocuments = updatedGroups.flatMap(group => 
    group.items.map(item => ({...item, groupId: group.id, userId: currentUser}))
  );
  
  // Combiner les documents indépendants et ceux des groupes
  const allDocuments = [...updatedDocuments, ...groupDocuments];
  
  // Groupes sans les items (pour éviter une duplication)
  const groupsWithoutItems = updatedGroups.map(({items, ...rest}) => rest);
  
  localStorage.setItem(`collaboration_documents_${currentUser}`, JSON.stringify(allDocuments));
  localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(groupsWithoutItems));
  console.log(`Sauvegarde locale réussie: ${allDocuments.length} documents, ${groupsWithoutItems.length} groupes pour ${currentUser}`);
  
  // Notifier sur la mise à jour de la bibliothèque
  window.dispatchEvent(new Event('collaborationUpdate'));
};
