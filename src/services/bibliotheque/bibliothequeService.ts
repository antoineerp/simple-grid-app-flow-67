
import { Document, DocumentGroup, BibliothequeItem } from '@/types/bibliotheque';
import { v4 as uuidv4 } from 'uuid';

export const loadBibliothequeFromStorage = (userId: string): { documents: Document[], groups: DocumentGroup[] } => {
  try {
    const storageKey = `bibliotheque_${userId}`;
    const docsKey = `${storageKey}_documents`;
    const groupsKey = `${storageKey}_groups`;
    
    // Charger les documents depuis le localStorage
    const docsJson = localStorage.getItem(docsKey);
    const documents: Document[] = docsJson ? JSON.parse(docsJson) : [];
    
    // Charger les groupes depuis le localStorage
    const groupsJson = localStorage.getItem(groupsKey);
    const groups: DocumentGroup[] = groupsJson ? JSON.parse(groupsJson) : [];
    
    return { documents, groups };
  } catch (error) {
    console.error('Erreur lors du chargement de la bibliothèque:', error);
    return { documents: [], groups: [] };
  }
};

export const saveBibliothequeToStorage = (documents: Document[], groups: DocumentGroup[], userId: string): void => {
  try {
    const storageKey = `bibliotheque_${userId}`;
    const docsKey = `${storageKey}_documents`;
    const groupsKey = `${storageKey}_groups`;
    
    // Enregistrer les documents dans le localStorage
    localStorage.setItem(docsKey, JSON.stringify(documents));
    
    // Enregistrer les groupes dans le localStorage
    localStorage.setItem(groupsKey, JSON.stringify(groups));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la bibliothèque:', error);
  }
};

export const getBibliothequeItems = async (): Promise<BibliothequeItem[]> => {
  try {
    const userId = localStorage.getItem('currentUser') || 'default';
    const { documents } = loadBibliothequeFromStorage(userId);
    return documents;
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    return [];
  }
};
