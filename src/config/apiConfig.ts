
// Configuration de l'API avec vérification d'exécution PHP renforcée
let apiUrl = '/api';
let isCustomUrl = false;

// Détection automatique de l'environnement
function detectEnvironment() {
  const hostname = window.location.hostname;
  const isInfomaniak = hostname.includes('myd.infomaniak.com') || hostname.includes('qualiopi.ch');
  
  console.log('Détection d\'environnement - Hostname:', hostname);
  console.log('Détection d\'environnement - Est Infomaniak:', isInfomaniak);
  
  if (isInfomaniak) {
    // Configuration pour Infomaniak - utiliser le chemin relatif au domaine
    apiUrl = '/api';
    console.log('Environnement Infomaniak détecté - API URL:', apiUrl);
  } else {
    // Pour l'environnement de développement ou preview Lovable
    apiUrl = '/api';
    console.log('Environnement de développement détecté - API URL:', apiUrl);
  }
}

// Forcer une détection initiale
detectEnvironment();

// Obtenir l'URL de l'API
export function getApiUrl(): string {
  return apiUrl;
}

// Obtenir l'URL complète de l'API (avec le hostname)
export function getFullApiUrl(): string {
  return apiUrl.startsWith('http') 
    ? apiUrl 
    : `${window.location.protocol}//${window.location.host}${apiUrl}`;
}

// Vérifier l'exécution PHP avec nouvelle approche plus fiable
export async function checkPhpExecution(): Promise<boolean> {
  try {
    const verifyUrl = `${getApiUrl()}/verify-php-execution.php`;
    console.log(`Vérification de l'exécution PHP:`, verifyUrl);
    
    // Ajouter un timestamp pour éviter la mise en cache
    const urlWithTimestamp = `${verifyUrl}?t=${Date.now()}`;
    
    const response = await fetch(urlWithTimestamp, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    // Vérifier si la réponse HTTP est valide
    if (!response.ok) {
      console.error(`Échec de la vérification PHP: ${response.status} ${response.statusText}`);
      return false;
    }
    
    // Récupérer le corps de la réponse
    const text = await response.text();
    
    // Vérifier si le contenu commence par "<?php"
    if (text.trim().startsWith('<?php')) {
      console.error('Code PHP non exécuté détecté lors de la vérification');
      return false;
    }
    
    // Vérifier si c'est du HTML au lieu de JSON
    if (text.trim().toLowerCase().startsWith('<!doctype') || 
        text.trim().toLowerCase().startsWith('<html')) {
      console.error('Réponse HTML reçue au lieu de JSON lors de la vérification PHP');
      return false;
    }
    
    // Essayer de parser le JSON
    try {
      const data = JSON.parse(text);
      
      if (data && data.status === 'success' && data.php_version) {
        console.log('Vérification PHP réussie:', data);
        return true;
      } else {
        console.warn('Réponse PHP reçue mais format inattendu:', data);
        return false;
      }
    } catch (e) {
      console.error('Réponse non-JSON de la vérification PHP:', text.substring(0, 150));
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de la vérification PHP:', error);
    return false;
  }
}

// Test amélioré de connexion à l'API avec vérification PHP préalable
export async function testApiConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    // Vérifier d'abord l'exécution PHP
    const phpExecutionOk = await checkPhpExecution();
    
    if (!phpExecutionOk) {
      console.warn('Problème d\'exécution PHP détecté, vérifiez la configuration du serveur');
    }
    
    console.log(`Test de connexion à l'API:`, getFullApiUrl());
    
    // Ajouter un timestamp pour éviter la mise en cache
    const urlWithTimestamp = `${getApiUrl()}/index.php?t=${Date.now()}`;
    
    const response = await fetch(urlWithTimestamp, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    console.log('Réponse du test API:', response.status, response.statusText);
    console.log('Headers:', response.headers.entries());
    
    // Récupérer le texte de la réponse
    const responseText = await response.text();
    
    // Vérifier si le serveur répond avec du PHP non interprété
    if (responseText.trim().startsWith('<?php')) {
      console.error('Code PHP non exécuté détecté dans la réponse');
      return {
        success: false,
        message: 'Le serveur renvoie le code PHP au lieu de l\'exécuter',
        details: {
          tip: 'Vérifiez la configuration du serveur pour exécuter les fichiers PHP. Vérifiez le fichier .htaccess et les permissions.'
        }
      };
    }
    
    // Vérifier si la réponse est du HTML au lieu de JSON
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.warn('Réponse HTML reçue au lieu de JSON');
      return {
        success: false,
        message: 'Le serveur a renvoyé du HTML au lieu de JSON',
        details: {
          tip: 'Vérifiez que le script PHP génère correctement du JSON avec les bons headers.'
        }
      };
    }
    
    // Essayer de parser la réponse comme JSON
    try {
      const data = JSON.parse(responseText);
      return {
        success: true,
        message: data.message || 'API connectée',
        details: data
      };
    } catch (e) {
      return {
        success: false,
        message: 'Réponse non-JSON reçue de l\'API',
        details: {
          error: e instanceof Error ? e.message : String(e),
          responseText: responseText.substring(0, 300)
        }
      };
    }
  } catch (error) {
    console.error('Erreur lors du test API:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      details: { error }
    };
  }
}

// Définir une URL personnalisée pour l'API
export function setCustomApiUrl(url: string): void {
  apiUrl = url;
  isCustomUrl = true;
  console.log('URL API personnalisée définie:', url);
}

// Réinitialiser l'URL de l'API à sa valeur par défaut
export function resetToDefaultApiUrl(): void {
  detectEnvironment(); // Redétecter l'environnement
  isCustomUrl = false;
  console.log('URL API réinitialisée à la valeur par défaut:', apiUrl);
}

// Vérifier si une URL personnalisée est utilisée
export function isUsingCustomApiUrl(): boolean {
  return isCustomUrl;
}

// Fonction utilitaire pour les requêtes fetch avec gestion d'erreur
export async function fetchWithErrorHandling(url: string, options?: RequestInit): Promise<any> {
  try {
    console.log(`Requête vers: ${url}`, options);
    const response = await fetch(url, options);
    
    console.log(`Réponse reçue: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // Lire le corps de la réponse
      const responseText = await response.text();
      let errorMessage = `Erreur HTTP: ${response.status}`;
      
      // Vérifier si la réponse est du PHP non exécuté
      if (responseText.trim().startsWith('<?php')) {
        console.error('Code PHP non exécuté détecté');
        throw new Error('Le serveur renvoie le code PHP au lieu de l\'exécuter. Vérifiez la configuration du serveur.');
      }
      
      // Vérifier si la réponse est du HTML au lieu de JSON
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('Réponse HTML reçue au lieu de JSON');
        throw new Error('Le serveur a renvoyé du HTML au lieu de JSON. Vérifiez la configuration.');
      }
      
      // Essayer de parser comme JSON
      try {
        const errorData = JSON.parse(responseText);
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Si la réponse n'est pas du JSON, utiliser le texte brut
        errorMessage = `Erreur: ${responseText.substring(0, 100)}...`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Si la réponse est vide, retourner un objet vide
    const text = await response.text();
    if (!text) {
      return {};
    }
    
    // Vérifier si la réponse est du PHP non exécuté
    if (text.trim().startsWith('<?php')) {
      console.error('Code PHP non exécuté');
      throw new Error('Le serveur renvoie le code PHP au lieu de l\'exécuter. Vérifiez la configuration du serveur.');
    }
    
    // Vérifier si la réponse est du HTML au lieu de JSON
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      console.error('Réponse HTML reçue au lieu de JSON');
      throw new Error('Le serveur a renvoyé du HTML au lieu de JSON. Vérifiez la configuration.');
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Erreur de parsing JSON:", e);
      console.error("Texte reçu:", text.substring(0, 300));
      throw new Error(`Réponse invalide: ${text.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error("Erreur lors de la requête:", error);
    throw error;
  }
}
