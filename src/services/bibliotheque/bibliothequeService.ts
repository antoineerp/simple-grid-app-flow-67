
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';

/**
 * Loads bibliotheque documents from localStorage for a specific user
 */
export const loadBibliothequeFromStorage = (): { documents: Document[], groups: DocumentGroup[] } => {
  const currentUser = getCurrentUser();
  
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
        { id: "1", name: 'Organigramme', link: 'Voir le document' },
        { id: "2", name: 'Administration', link: 'Voir le document' },
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
export const saveBibliothequeToStorage = (documents: Document[], groups: DocumentGroup[]): void => {
  const currentUser = getCurrentUser();
  
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

/**
 * Synchronise la bibliothèque avec le serveur
 */
export const syncBibliothequeWithServer = async (documents: Document[], groups: DocumentGroup[]): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    console.log(`Synchronisation de la bibliothèque pour l'utilisateur ${userId}`);
    
    // Extraction des documents des groupes et préparation pour la synchronisation
    const groupDocuments = groups.flatMap(group => 
      group.items.map(item => ({...item, groupId: group.id}))
    );
    
    // Combiner les documents indépendants et ceux des groupes
    const allDocuments = [...documents, ...groupDocuments];
    
    const response = await fetch(`${API_URL}/bibliotheque-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        documents: allDocuments,
        groups: groups.map(({items, ...rest}) => rest)
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la synchronisation de la bibliothèque: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erreur lors de la synchronisation de la bibliothèque');
    }
    
    toast({
      title: 'Synchronisation réussie',
      description: 'Bibliothèque synchronisée avec le serveur.'
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la synchronisation de la bibliothèque:', error);
    
    toast({
      variant: 'destructive',
      title: 'Erreur de synchronisation',
      description: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    
    return false;
  }
};

/**
 * Charge la bibliothèque depuis le serveur
 */
export const loadBibliothequeFromServer = async (): Promise<{ documents: Document[], groups: DocumentGroup[] }> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    console.log(`Chargement de la bibliothèque depuis le serveur pour l'utilisateur ${userId}`);
    
    const response = await fetch(`${API_URL}/bibliotheque-load.php?userId=${userId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement de la bibliothèque: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erreur lors du chargement de la bibliothèque');
    }
    
    // Si succès, mettre à jour le stockage local
    if (result.documents && result.groups) {
      saveBibliothequeToStorage(result.documents, result.groups);
      return { documents: result.documents, groups: result.groups };
    }
    
    throw new Error('Format de données incorrect reçu du serveur');
  } catch (error) {
    console.error('Erreur lors du chargement de la bibliothèque depuis le serveur:', error);
    
    // En cas d'erreur, essayer de récupérer depuis le stockage local
    return loadBibliothequeFromStorage();
  }
};
