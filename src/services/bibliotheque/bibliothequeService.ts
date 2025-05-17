
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
  } else {
    const defaultDocuments = localStorage.getItem('collaboration_documents_template') || localStorage.getItem('collaboration_documents');
    if (defaultDocuments) {
      documents = JSON.parse(defaultDocuments);
    } else {
      documents = [
        { id: "1", name: 'Organigramme', link: 'Voir le document', userId: currentUser },
        { id: "2", name: 'Administration', link: 'Voir le document', userId: currentUser },
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
        { id: "1", name: 'Documents organisationnels', expanded: false, items: [], userId: currentUser },
        { id: "2", name: 'Documents administratifs', expanded: false, items: [], userId: currentUser },
      ];
    }
  }
  
  // Process groups and maintain correct types
  const processedGroups: DocumentGroup[] = groups.map(group => {
    // Find documents that belong to this group
    const groupDocuments = documents.filter(doc => doc.groupId === group.id);
    
    // Extract just the IDs for the items array
    const documentIds = groupDocuments.map(doc => doc.id);
    
    return {
      id: group.id,
      name: group.name,
      expanded: group.expanded,
      items: documentIds,
      userId: group.userId
    };
  });
  
  // Filter documents that are not in any group (standalone)
  const standaloneDocuments = documents.filter(doc => !doc.groupId);
  
  return { documents: standaloneDocuments, groups: processedGroups };
};

/**
 * Saves collaboration documents to localStorage for a specific user
 */
export const saveBibliothequeToStorage = (documents: Document[], groups: DocumentGroup[], currentUser: string): void => {
  // We need to combine standalone documents with documents from groups
  // and ensure the groupId is preserved
  
  // First, let's collect all the documents from groups
  const documentMap: {[key: string]: Document} = {};
  
  // Add standalone documents to the map
  documents.forEach(doc => {
    documentMap[doc.id] = doc;
  });
  
  // Process groups and add their documents to the map
  groups.forEach(group => {
    group.items.forEach(docId => {
      // If we don't have this document in our map, create a placeholder
      if (!documentMap[docId]) {
        documentMap[docId] = {
          id: docId,
          name: 'Unknown document',
          link: '',
          userId: currentUser,
          groupId: group.id
        };
      } else {
        // Set the groupId of the existing document
        documentMap[docId] = {
          ...documentMap[docId],
          groupId: group.id
        };
      }
    });
  });
  
  // Convert map back to array
  const allDocuments = Object.values(documentMap);
  
  // Save to localStorage
  localStorage.setItem(`collaboration_documents_${currentUser}`, JSON.stringify(allDocuments));
  localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(groups));
  
  // If the user is admin, also save as template
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin' || userRole === 'administrateur') {
    localStorage.setItem('collaboration_documents_template', JSON.stringify(allDocuments));
    localStorage.setItem('collaboration_groups_template', JSON.stringify(groups));
  }
  
  // Notify on library update
  window.dispatchEvent(new Event('collaborationUpdate'));
};
