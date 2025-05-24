
import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * CHARGEMENT EXCLUSIF DEPUIS LA BASE DE DONNÉES INFOMANIAK
 * Aucun fallback local, aucun cache - UNIQUEMENT la base de données
 */
export const loadMembresFromServer = async (currentUser: any): Promise<Membre[]> => {
  try {
    const API_URL = getApiUrl();
    
    // Validation stricte de l'utilisateur
    if (!currentUser || typeof currentUser !== 'string') {
      throw new Error("Identifiant utilisateur invalide pour la base de données Infomaniak");
    }
    
    console.log(`CHARGEMENT EXCLUSIF depuis la base de données Infomaniak pour: ${currentUser}`);
    
    const encodedUserId = encodeURIComponent(currentUser);
    const url = `${API_URL}/membres-load.php?userId=${encodedUserId}`;
    const urlWithTimestamp = `${url}&_t=${new Date().getTime()}`;
    
    console.log(`Requête vers base de données Infomaniak: ${urlWithTimestamp}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const response = await fetch(urlWithTimestamp, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Réponse base de données Infomaniak - Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ERREUR base de données Infomaniak (${response.status}):`, errorText);
        throw new Error(`Erreur base de données Infomaniak: ${response.status} - ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log(`Réponse base de données Infomaniak (${responseText.length} caractères):`, responseText.substring(0, 200));
      
      if (!responseText || !responseText.trim()) {
        console.warn("Réponse vide de la base de données Infomaniak");
        return [];
      }
      
      // Vérifier que la réponse est bien du JSON et non du HTML/PHP
      if (responseText.includes('<?php') || responseText.includes('<html') || responseText.includes('<br')) {
        console.error("ERREUR: La base de données Infomaniak a renvoyé du HTML/PHP au lieu de JSON:", responseText.substring(0, 200));
        throw new Error("La base de données Infomaniak a renvoyé une page HTML au lieu de données JSON");
      }
      
      try {
        const result = JSON.parse(responseText);
        
        if (!result.success) {
          throw new Error(result.message || "Erreur base de données Infomaniak lors du chargement des membres");
        }
        
        const membres = result.membres || [];
        console.log(`${membres.length} membres récupérés depuis la base de données Infomaniak`);
        
        // Transformer les dates et valider les données
        return membres.map((membre: any) => ({
          ...membre,
          date_creation: membre.date_creation ? new Date(membre.date_creation) : new Date(),
          initiales: membre.initiales || `${membre.prenom?.charAt(0) || ''}${membre.nom?.charAt(0) || ''}`
        }));
        
      } catch (jsonError) {
        console.error("ERREUR parsing JSON depuis la base de données Infomaniak:", jsonError);
        console.error("Réponse brute:", responseText.substring(0, 500));
        throw new Error("Format de réponse invalide de la base de données Infomaniak");
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error("Délai d'attente dépassé lors de l'accès à la base de données Infomaniak");
      }
      throw error;
    }
    
  } catch (error) {
    console.error('ERREUR CRITIQUE base de données Infomaniak:', error);
    throw error;
  }
};

/**
 * SYNCHRONISATION EXCLUSIVE AVEC LA BASE DE DONNÉES INFOMANIAK
 */
export const syncMembresWithServer = async (membres: Membre[], currentUser: any): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    
    if (!currentUser || typeof currentUser !== 'string') {
      throw new Error("Identifiant utilisateur invalide pour la synchronisation avec la base de données Infomaniak");
    }
    
    console.log(`SYNCHRONISATION EXCLUSIVE avec la base de données Infomaniak pour: ${currentUser}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    try {
      const membresForSync = membres.map(membre => ({
        ...membre,
        date_creation: membre.date_creation instanceof Date 
          ? membre.date_creation.toISOString() 
          : membre.date_creation
      }));
      
      console.log(`Envoi de ${membresForSync.length} membres vers la base de données Infomaniak`);
      
      const response = await fetch(`${API_URL}/membres-sync.php`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({ userId: currentUser, membres: membresForSync }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ERREUR synchronisation base de données Infomaniak: ${response.status}`, errorText);
        throw new Error(`Échec synchronisation base de données Infomaniak: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      if (!responseText || !responseText.trim()) {
        console.warn("Réponse vide lors de la synchronisation avec la base de données Infomaniak");
        return false;
      }
      
      if (responseText.includes('<?php') || responseText.includes('<html') || responseText.includes('<br')) {
        console.error("ERREUR: Réponse HTML/PHP de la base de données Infomaniak au lieu de JSON:", responseText.substring(0, 200));
        throw new Error("La base de données Infomaniak a renvoyé du HTML au lieu de JSON");
      }
      
      try {
        const result = JSON.parse(responseText);
        console.log("Résultat synchronisation base de données Infomaniak:", result);
        
        if (!result.success) {
          throw new Error(result.message || "Erreur synchronisation base de données Infomaniak");
        }
        
        return true;
      } catch (e) {
        console.error("Erreur parsing réponse synchronisation base de données Infomaniak:", e);
        throw new Error("Impossible de traiter la réponse de la base de données Infomaniak");
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error("Délai d'attente dépassé lors de la synchronisation avec la base de données Infomaniak");
      }
      throw error;
    }
    
  } catch (error) {
    console.error('ERREUR synchronisation base de données Infomaniak:', error);
    throw error;
  }
};
