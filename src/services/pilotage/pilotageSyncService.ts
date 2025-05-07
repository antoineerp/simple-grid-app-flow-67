
import { Document } from '@/types/documents';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Synchronise les documents de pilotage avec le serveur
 */
export const syncPilotageWithServer = async (
  documents: Document[],
  currentUser: string
): Promise<boolean> => {
  try {
    console.log(`Synchronisation des documents de pilotage pour l'utilisateur ${currentUser}`);
    
    // D'abord, synchroniser localement
    localStorage.setItem(`pilotage_${currentUser}`, JSON.stringify(documents));
    
    // Ensuite, synchroniser avec le serveur si en ligne
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/pilotage-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: currentUser, documents })
    });
    
    if (!response.ok) {
      console.error(`Erreur lors de la synchronisation des documents de pilotage: ${response.status}`);
      const errorText = await response.text();
      console.error("Détails de l'erreur:", errorText);
      
      // Même en cas d'échec de la synchronisation serveur, la synchronisation locale a fonctionné
      return true;
    }
    
    const result = await response.json();
    console.log("Résultat de la synchronisation des documents de pilotage:", result);
    
    return true;
  } catch (error) {
    console.error('Erreur de synchronisation des documents de pilotage:', error);
    // La synchronisation locale a quand même fonctionné
    return true;
  }
};

/**
 * Charge les documents de pilotage depuis le stockage local
 */
export const loadPilotageFromStorage = (currentUser: string): Document[] => {
  const storedDocuments = localStorage.getItem(`pilotage_${currentUser}`);
  
  if (storedDocuments) {
    return JSON.parse(storedDocuments);
  } else {
    const defaultDocuments = localStorage.getItem('pilotage_template') || localStorage.getItem('pilotage');
    
    if (defaultDocuments) {
      return JSON.parse(defaultDocuments);
    }
    
    return [
      { 
        id: '1', 
        nom: 'Politique qualité', 
        fichier_path: null,
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: null,
        date_creation: new Date(),
        date_modification: new Date()
      },
      { 
        id: '2', 
        nom: 'Plan d\'action', 
        fichier_path: null,
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: null,
        date_creation: new Date(),
        date_modification: new Date()
      },
    ];
  }
};
