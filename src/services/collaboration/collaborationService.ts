
import { Document, DocumentGroup } from '@/types/bibliotheque';

// ID utilisateur fixe pour toute l'application
const FIXED_USER_ID = 'p71x6d_richard';

/**
 * Loads collaboration documents from localStorage for a specific user
 */
export const loadCollaborationFromStorage = (currentUser: string = FIXED_USER_ID): { documents: Document[], groups: DocumentGroup[] } => {
  // Forcer l'utilisation de l'ID utilisateur fixe
  currentUser = FIXED_USER_ID;
  
  const storedDocuments = localStorage.getItem(`collaboration_documents_${currentUser}`);
  const storedGroups = localStorage.getItem(`collaboration_groups_${currentUser}`);
  
  let documents: Document[] = [];
  let groups: DocumentGroup[] = [];
  
  if (storedDocuments) {
    documents = JSON.parse(storedDocuments);
  } else {
    const defaultDocuments = localStorage.getItem('collaboration_documents_template') || localStorage.getItem('collaboration_documents');
    if (defaultDocuments) {
      documents = JSON.parse(defaultDocuments);
    } else {
      documents = [
        { id: "1", name: 'Document de référence', link: 'Voir le document' },
        { id: "2", name: 'Document technique', link: 'Voir le document' },
      ];
    }
  }
  
  if (storedGroups) {
    groups = JSON.parse(storedGroups);
  } else {
    const defaultGroups = localStorage.getItem('collaboration_groups_template') || localStorage.getItem('collaboration_groups');
    if (defaultGroups) {
      groups = JSON.parse(defaultGroups);
    } else {
      groups = [
        { id: "1", name: 'Documents organisationnels', expanded: false, items: [] },
        { id: "2", name: 'Documents techniques', expanded: false, items: [] },
      ];
    }
  }
  
  // Associer les documents aux groupes
  groups = groups.map(group => {
    const items = documents.filter(doc => doc.groupId === group.id);
    return { ...group, items };
  });
  
  // Retirer les documents déjà associés à des groupes
  documents = documents.filter(doc => !doc.groupId);
  
  return { documents, groups };
};

/**
 * Saves collaboration documents to localStorage for a specific user
 */
export const saveCollaborationToStorage = (documents: Document[], groups: DocumentGroup[], currentUser: string = FIXED_USER_ID): void => {
  // Forcer l'utilisation de l'ID utilisateur fixe
  currentUser = FIXED_USER_ID;
  
  // Extraction des documents des groupes
  const groupDocuments = groups.flatMap(group => 
    group.items.map(item => ({...item, groupId: group.id}))
  );
  
  // Combiner les documents indépendants et ceux des groupes
  const allDocuments = [...documents, ...groupDocuments];
  
  // Groupes sans les items (pour éviter une duplication)
  const groupsWithoutItems = groups.map(({items, ...rest}) => rest);
  
  localStorage.setItem(`collaboration_documents_${currentUser}`, JSON.stringify(allDocuments));
  localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(groupsWithoutItems));
  
  // Si l'utilisateur est admin, aussi sauvegarder comme template
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin' || userRole === 'administrateur') {
    localStorage.setItem('collaboration_documents_template', JSON.stringify(allDocuments));
    localStorage.setItem('collaboration_groups_template', JSON.stringify(groupsWithoutItems));
  }
  
  // Notifier sur la mise à jour de la collaboration
  window.dispatchEvent(new Event('collaborationUpdate'));
};
