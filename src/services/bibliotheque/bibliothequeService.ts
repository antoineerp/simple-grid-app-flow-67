
import { Document, DocumentGroup } from '@/types/bibliotheque';

/**
 * Loads bibliotheque documents from localStorage for a specific user
 */
export const loadBibliothequeFromStorage = (currentUser: string): { documents: Document[], groups: DocumentGroup[] } => {
  const storedDocuments = localStorage.getItem(`bibliotheque_documents_${currentUser}`);
  const storedGroups = localStorage.getItem(`bibliotheque_groups_${currentUser}`);
  
  let documents: Document[] = [];
  let groups: DocumentGroup[] = [];
  
  if (storedDocuments) {
    documents = JSON.parse(storedDocuments);
  } else {
    const defaultDocuments = localStorage.getItem('bibliotheque_documents_template') || localStorage.getItem('bibliotheque_documents');
    if (defaultDocuments) {
      documents = JSON.parse(defaultDocuments);
    } else {
      documents = [
        { 
          id: "1", 
          titre: 'Organigramme', 
          description: 'Document organisationnel',
          url: '/documents/organigramme.pdf',
          date_creation: new Date().toISOString()
        },
        { 
          id: "2", 
          titre: 'Administration', 
          description: 'Document administratif',
          url: '/documents/administration.pdf',
          date_creation: new Date().toISOString()
        },
      ];
    }
  }
  
  if (storedGroups) {
    groups = JSON.parse(storedGroups);
  } else {
    const defaultGroups = localStorage.getItem('bibliotheque_groups_template') || localStorage.getItem('bibliotheque_groups');
    if (defaultGroups) {
      groups = JSON.parse(defaultGroups);
    } else {
      groups = [
        { id: "1", name: 'Documents organisationnels', expanded: false, items: [] },
        { id: "2", name: 'Documents administratifs', expanded: false, items: [] },
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
 * Saves bibliotheque documents to localStorage for a specific user
 */
export const saveBibliothequeToStorage = (documents: Document[], groups: DocumentGroup[], currentUser: string): void => {
  // Extraction des documents des groupes
  const groupDocuments = groups.flatMap(group => 
    group.items.map(item => ({...item, groupId: group.id}))
  );
  
  // Combiner les documents indépendants et ceux des groupes
  const allDocuments = [...documents, ...groupDocuments];
  
  // Groupes sans les items (pour éviter une duplication)
  const groupsWithoutItems = groups.map(({items, ...rest}) => rest);
  
  localStorage.setItem(`bibliotheque_documents_${currentUser}`, JSON.stringify(allDocuments));
  localStorage.setItem(`bibliotheque_groups_${currentUser}`, JSON.stringify(groupsWithoutItems));
  
  // Si l'utilisateur est admin, aussi sauvegarder comme template
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin' || userRole === 'administrateur') {
    localStorage.setItem('bibliotheque_documents_template', JSON.stringify(allDocuments));
    localStorage.setItem('bibliotheque_groups_template', JSON.stringify(groupsWithoutItems));
  }
  
  // Notifier sur la mise à jour de la bibliothèque
  window.dispatchEvent(new Event('bibliothequeUpdate'));
};
