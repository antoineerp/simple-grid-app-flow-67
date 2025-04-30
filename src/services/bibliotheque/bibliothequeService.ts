
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { v4 as uuidv4 } from 'uuid';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

export const bibliothequeService = {
  getInitialDocuments: (): Document[] => {
    const currentUserId = getDatabaseConnectionCurrentUser() || 'default';
    
    return [
      {
        id: uuidv4(),
        name: 'Document 1',
        link: 'https://example.com/doc1',
        userId: currentUserId
      },
      {
        id: uuidv4(),
        name: 'Document 2',
        link: 'https://example.com/doc2',
        userId: currentUserId
      }
    ];
  },
  
  getInitialGroups: (): DocumentGroup[] => {
    const currentUserId = getDatabaseConnectionCurrentUser() || 'default';
    
    return [
      {
        id: uuidv4(),
        name: 'Groupe 1',
        expanded: false,
        items: [],
        userId: currentUserId
      },
      {
        id: uuidv4(),
        name: 'Groupe 2',
        expanded: false,
        items: [],
        userId: currentUserId
      }
    ];
  },
  
  saveDocuments: (documents: Document[]): void => {
    localStorage.setItem('bibliotheque', JSON.stringify(documents));
  },
  
  saveGroups: (groups: DocumentGroup[]): void => {
    localStorage.setItem('bibliotheque_groups', JSON.stringify(groups));
  },
  
  loadDocuments: (): Document[] => {
    const storedData = localStorage.getItem('bibliotheque');
    if (storedData) {
      try {
        return JSON.parse(storedData);
      } catch (e) {
        console.error('Erreur lors de la lecture des documents:', e);
      }
    }
    return [];
  },
  
  loadGroups: (): DocumentGroup[] => {
    const storedData = localStorage.getItem('bibliotheque_groups');
    if (storedData) {
      try {
        return JSON.parse(storedData);
      } catch (e) {
        console.error('Erreur lors de la lecture des groupes:', e);
      }
    }
    return [];
  }
};
