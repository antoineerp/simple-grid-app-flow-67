
import { Document, DocumentGroup } from '@/types/bibliotheque';

/**
 * Loads collaboration documents from localStorage for a specific user
 */
export const loadBibliothequeFromStorage = (currentUser: string): { documents: Document[], groups: DocumentGroup[] } => {
  const storedDocuments = localStorage.getItem(`collaboration_documents_${currentUser}`);
  const storedGroups = localStorage.getItem(`collaboration_groups_${currentUser}`);
  
  let documents: Document[] = [];
  let groups: DocumentGroup[] = [];
  
  if (storedDocuments) {
    documents = JSON.parse(storedDocuments);
    console.log(`Chargé ${documents.length} documents pour l'utilisateur ${currentUser}`);
  } else {
    const defaultDocuments = localStorage.getItem('collaboration_documents_template') || localStorage.getItem('collaboration_documents');
    if (defaultDocuments) {
      documents = JSON.parse(defaultDocuments);
      console.log(`Chargé ${documents.length} documents depuis le template pour l'utilisateur ${currentUser}`);
    } else {
      documents = [
        { id: "1", name: 'Organigramme', link: 'Voir le document', userId: currentUser },
        { id: "2", name: 'Administration', link: 'Voir le document', userId: currentUser },
      ];
      console.log(`Créé des documents par défaut pour l'utilisateur ${currentUser}`);
    }
  }
  
  if (storedGroups) {
    groups = JSON.parse(storedGroups);
    console.log(`Chargé ${groups.length} groupes pour l'utilisateur ${currentUser}`);
  } else {
    const defaultGroups = localStorage.getItem('collaboration_groups_template') || localStorage.getItem('collaboration_groups');
    if (defaultGroups) {
      groups = JSON.parse(defaultGroups);
      console.log(`Chargé ${groups.length} groupes depuis le template pour l'utilisateur ${currentUser}`);
    } else {
      groups = [
        { id: "1", name: 'Documents organisationnels', expanded: false, items: [], userId: currentUser },
        { id: "2", name: 'Documents administratifs', expanded: false, items: [], userId: currentUser },
      ];
      console.log(`Créé des groupes par défaut pour l'utilisateur ${currentUser}`);
    }
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
 * Saves collaboration documents to localStorage for a specific user
 */
export const saveBibliothequeToStorage = (documents: Document[], groups: DocumentGroup[], currentUser: string): void => {
  console.log(`Sauvegarde des documents pour l'utilisateur ${currentUser}`);
  
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
  console.log(`Sauvegarde réussie: ${allDocuments.length} documents, ${groupsWithoutItems.length} groupes pour ${currentUser}`);
  
  // Si l'utilisateur est admin, aussi sauvegarder comme template
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin' || userRole === 'administrateur') {
    localStorage.setItem('collaboration_documents_template', JSON.stringify(allDocuments));
    localStorage.setItem('collaboration_groups_template', JSON.stringify(groupsWithoutItems));
    console.log("Modèle de documents et groupes mis à jour (utilisateur administrateur)");
  }
  
  // Notifier sur la mise à jour de la bibliothèque
  window.dispatchEvent(new Event('collaborationUpdate'));
};
