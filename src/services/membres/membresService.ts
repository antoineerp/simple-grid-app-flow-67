import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Extrait un identifiant utilisateur valide pour les requêtes
 */
const extractValidUserId = (userId: any): string => {
  // Si l'entrée est undefined ou null
  if (userId === undefined || userId === null) {
    console.log("userId invalide (null/undefined), utilisation de l'ID par défaut");
    return 'p71x6d_system';
  }
  
  // Si c'est déjà une chaîne, la retourner directement (mais vérifier si c'est [object Object])
  if (typeof userId === 'string') {
    // Vérifier si la chaîne est [object Object]
    if (userId === '[object Object]' || userId.includes('object')) {
      console.log("userId est la chaîne '[object Object]', utilisation de l'ID par défaut");
      return 'p71x6d_system';
    }
    return userId;
  }
  
  // Si c'est un objet, essayer d'extraire un identifiant
  if (typeof userId === 'object') {
    // Journaliser l'identifiant reçu pour débogage
    console.log("Identifiant objet reçu:", JSON.stringify(userId));
    
    // Propriétés potentielles pour extraire un ID
    const idProperties = ['identifiant_technique', 'email', 'id'];
    
    for (const prop of idProperties) {
      if (userId[prop] && typeof userId[prop] === 'string' && userId[prop].length > 0) {
        console.log(`ID utilisateur extrait de l'objet: ${prop}=${userId[prop]}`);
        return userId[prop];
      }
    }
    
    // Si toString() renvoie quelque chose d'autre que [object Object], l'utiliser
    const userIdString = String(userId);
    if (userIdString !== '[object Object]' && userIdString !== 'null' && userIdString !== 'undefined') {
      console.log(`Conversion de l'objet en chaîne: ${userIdString}`);
      return userIdString;
    }
  }
  
  console.log(`Utilisation de l'ID par défaut: p71x6d_system`);
  return 'p71x6d_system'; // Valeur par défaut si rien n'est valide
};

/**
 * Charge les membres depuis le serveur Infomaniak uniquement
 */
export const loadMembresFromServer = async (currentUser: any): Promise<Membre[]> => {
  try {
    const API_URL = getApiUrl();
    
    // Extraire l'identifiant technique ou email de l'utilisateur
    const userId = extractValidUserId(currentUser);
    console.log(`Chargement des membres depuis le serveur pour l'utilisateur ${userId}`);
    
    // Vérifier que l'ID est bien une chaîne et non un objet
    if (typeof userId !== 'string') {
      throw new Error(`ID utilisateur invalide: ${typeof userId}`);
    }
    
    // Utiliser encodeURIComponent pour encoder l'ID utilisateur en toute sécurité
    const encodedUserId = encodeURIComponent(userId);
    const url = `${API_URL}/membres-load.php?userId=${encodedUserId}`;
    
    // Ajouter un timestamp pour éviter la mise en cache
    const urlWithTimestamp = `${url}&_t=${new Date().getTime()}`;
    
    // Ajout d'un logging pour déboguer
    console.log(`Requête membres: ${urlWithTimestamp}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes de timeout
    
    try {
      const response = await fetch(urlWithTimestamp, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Debug: Journaliser le statut et le texte de la réponse
      console.log(`Réponse membres statut: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur serveur (${response.status}) lors du chargement des membres:`, errorText);
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      
      const responseText = await response.text();
      
      // Debug: Journaliser les 200 premiers caractères de la réponse 
      console.log(`Réponse membres début: ${responseText.substring(0, 200)}`);
      
      // Vérifier si la réponse est vide
      if (!responseText || !responseText.trim()) {
        console.warn("Réponse vide du serveur");
        return [];
      }
      
      // Vérifier si la réponse contient du HTML ou PHP (erreur)
      if (responseText.includes('<?php') || responseText.includes('<html') || responseText.includes('<br')) {
        console.error("La réponse contient du HTML/PHP au lieu de JSON:", responseText.substring(0, 200));
        throw new Error("Le serveur a renvoyé une page HTML au lieu de données JSON");
      }
      
      try {
        const result = JSON.parse(responseText);
        
        if (!result.success) {
          throw new Error(result.message || "Erreur inconnue lors du chargement des membres");
        }
        
        // Transformer les dates string en objets Date
        const membres = result.membres || [];
        return membres.map((membre: any) => ({
          ...membre,
          date_creation: membre.date_creation ? new Date(membre.date_creation) : new Date()
        }));
      } catch (jsonError) {
        console.error("Erreur lors du parsing JSON:", jsonError);
        console.error("Réponse brute:", responseText.substring(0, 500));
        throw new Error("Format de réponse invalide");
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error("Délai d'attente dépassé lors du chargement des membres");
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors du chargement des membres depuis le serveur:', error);
    throw error;
  }
};

/**
 * Synchronise les membres avec le serveur Infomaniak uniquement
 */
export const syncMembresWithServer = async (membres: Membre[], currentUser: any): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    
    // Extraire l'identifiant technique ou email de l'utilisateur
    const userId = extractValidUserId(currentUser);
    console.log(`Synchronisation des membres pour l'utilisateur ${userId}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 secondes de timeout
    
    try {
      // Préparer les données à envoyer - convertir les objets Date en chaînes
      const membresForSync = membres.map(membre => ({
        ...membre,
        date_creation: membre.date_creation instanceof Date 
          ? membre.date_creation.toISOString() 
          : membre.date_creation
      }));
      
      // Journaliser pour le débogage
      console.log(`Envoi de ${membresForSync.length} membres pour synchronisation`);
      
      const response = await fetch(`${API_URL}/membres-sync.php`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, membres: membresForSync }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Erreur lors de la synchronisation des membres: ${response.status}`);
        
        // Essayer de récupérer les détails de l'erreur
        const errorText = await response.text();
        console.error("Détails de l'erreur:", errorText);
        
        if (errorText.trim().startsWith('{')) {
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || `Échec de la synchronisation: ${response.statusText}`);
          } catch (e) {
            console.error("Impossible de parser l'erreur JSON:", e);
          }
        }
        
        throw new Error(`Échec de la synchronisation: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      // Vérifier si la réponse est vide
      if (!responseText || !responseText.trim()) {
        console.warn("Réponse vide du serveur lors de la synchronisation");
        return false;
      }
      
      // Vérifier si la réponse contient du HTML ou PHP (erreur)
      if (responseText.includes('<?php') || responseText.includes('<html') || responseText.includes('<br')) {
        console.error("La réponse de synchronisation contient du HTML/PHP au lieu de JSON:", responseText.substring(0, 200));
        throw new Error("Le serveur a renvoyé une page HTML au lieu de données JSON");
      }
      
      try {
        const result = JSON.parse(responseText);
        console.log("Résultat de la synchronisation des membres:", result);
        
        if (!result.success) {
          throw new Error(result.message || "Erreur de synchronisation inconnue");
        }
        
        return true;
      } catch (e) {
        console.error("Erreur lors du parsing de la réponse:", e);
        console.error("Réponse brute reçue:", responseText);
        throw new Error("Impossible de traiter la réponse du serveur");
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error("Délai d'attente dépassé lors de la synchronisation");
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur de synchronisation des membres:', error);
    throw error;
  }
};
