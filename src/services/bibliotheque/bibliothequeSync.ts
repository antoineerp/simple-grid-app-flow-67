
import { Document, DocumentGroup } from '@/types/bibliotheque';
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
  
  // Si c'est déjà une chaîne, la retourner directement
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
 * Charge les documents de bibliothèque depuis le serveur
 */
export const loadBibliothequeFromServer = async (currentUser: any): Promise<{documents: Document[], groups: DocumentGroup[]} | null> => {
  try {
    const API_URL = getApiUrl();
    
    // Extraire l'identifiant technique ou email de l'utilisateur
    const userId = extractValidUserId(currentUser);
    console.log(`Chargement de la bibliothèque depuis le serveur pour l'utilisateur ${userId}`);
    
    // Vérifier que l'ID est bien une chaîne et non un objet
    if (typeof userId !== 'string') {
      throw new Error(`ID utilisateur invalide: ${typeof userId}`);
    }
    
    // Utiliser encodeURIComponent pour encoder l'ID utilisateur en toute sécurité
    const encodedUserId = encodeURIComponent(userId);
    const url = `${API_URL}/bibliotheque-load.php?userId=${encodedUserId}`;
    
    // Ajouter un timestamp pour éviter la mise en cache
    const urlWithTimestamp = `${url}&_t=${new Date().getTime()}`;
    
    // Ajout d'un logging pour déboguer
    console.log(`Requête bibliothèque: ${urlWithTimestamp}`);
    
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
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur serveur (${response.status}) lors du chargement de la bibliothèque:`, errorText);
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      
      const responseText = await response.text();
      
      // Vérifier si la réponse est vide
      if (!responseText || !responseText.trim()) {
        console.warn("Réponse vide du serveur");
        return { documents: [], groups: [] };
      }
      
      // Vérifier si la réponse contient du HTML ou PHP (erreur)
      if (responseText.includes('<?php') || responseText.includes('<html') || responseText.includes('<br')) {
        console.error("La réponse contient du HTML/PHP au lieu de JSON:", responseText.substring(0, 200));
        throw new Error("Le serveur a renvoyé une page HTML au lieu de données JSON");
      }
      
      try {
        const result = JSON.parse(responseText);
        
        if (!result.success) {
          throw new Error(result.message || "Erreur inconnue lors du chargement de la bibliothèque");
        }
        
        // Transformer les dates string en objets Date si nécessaire
        const ressources = result.ressources || [];
        const groupedRessources = groupRessources(ressources);
        
        return {
          documents: ressources,
          groups: groupedRessources
        };
      } catch (jsonError) {
        console.error("Erreur lors du parsing JSON:", jsonError);
        console.error("Réponse brute:", responseText.substring(0, 500));
        throw new Error("Format de réponse invalide");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error("Délai d'attente dépassé lors du chargement de la bibliothèque");
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la bibliothèque depuis le serveur:', error);
    throw error;
  }
};

/**
 * Regroupe les ressources par type ou catégorie
 */
const groupRessources = (ressources: Document[]): DocumentGroup[] => {
  // Cette fonction est à adapter selon votre logique de groupement
  const groupMap: Record<string, DocumentGroup> = {};
  
  ressources.forEach(ressource => {
    const type = ressource.type || 'Non catégorisé';
    
    if (!groupMap[type]) {
      groupMap[type] = {
        id: `group-${type}`,
        name: type,
        items: []
      };
    }
    
    groupMap[type].items.push(ressource);
  });
  
  return Object.values(groupMap);
};

/**
 * Synchronise les documents de bibliothèque avec le serveur
 */
export const syncBibliothequeWithServer = async (documents: Document[], groups: DocumentGroup[], currentUser: any): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    
    // Extraire l'identifiant technique ou email de l'utilisateur
    const userId = extractValidUserId(currentUser);
    console.log(`Synchronisation de la bibliothèque pour l'utilisateur ${userId}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 secondes de timeout
    
    try {
      // Préparer les données à envoyer
      const ressources = documents.map(doc => ({
        ...doc,
        // Convertir les dates si nécessaire
        date_creation: doc.date_creation instanceof Date 
          ? doc.date_creation.toISOString() 
          : doc.date_creation
      }));
      
      console.log(`Envoi de ${ressources.length} documents pour synchronisation de la bibliothèque`);
      
      const response = await fetch(`${API_URL}/bibliotheque-sync.php`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, ressources }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur lors de la synchronisation de la bibliothèque: ${response.status}`, errorText);
        throw new Error(`Échec de la synchronisation: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      // Vérifier la réponse
      if (!responseText || !responseText.trim()) {
        console.warn("Réponse vide du serveur lors de la synchronisation de la bibliothèque");
        return false;
      }
      
      try {
        const result = JSON.parse(responseText);
        console.log("Résultat de la synchronisation de la bibliothèque:", result);
        
        if (!result.success) {
          throw new Error(result.message || "Erreur de synchronisation inconnue");
        }
        
        return true;
      } catch (e) {
        console.error("Erreur lors du parsing de la réponse:", e);
        console.error("Réponse brute reçue:", responseText);
        throw new Error("Impossible de traiter la réponse du serveur");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error("Délai d'attente dépassé lors de la synchronisation");
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur de synchronisation de la bibliothèque:', error);
    throw error;
  }
};

