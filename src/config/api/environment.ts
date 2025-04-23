
/**
 * Gestion améliorée de la détection d'environnement (Infomaniak, dev, etc)
 */

let apiUrl = '/api';
let isCustomUrl = false;
let isInfomaniak = false;

export function detectEnvironment() {
  const hostname = window.location.hostname;
  
  // Détection plus précise d'Infomaniak
  isInfomaniak = hostname.includes('myd.infomaniak.com') || 
                hostname.includes('qualiopi.ch') ||
                hostname.includes('infomaniak') ||
                // Ajouter d'autres domaines Infomaniak si nécessaire
                hostname.includes('.web.app');
  
  console.log('Détection d\'environnement - Hostname:', hostname);
  console.log('Détection d\'environnement - Est Infomaniak:', isInfomaniak);
  
  // URL API absolue pour Infomaniak
  if (isInfomaniak) {
    // Utiliser le chemin absolu depuis la racine du domaine
    apiUrl = '/api';
    console.log('Environnement Infomaniak détecté - API URL:', apiUrl);
  } else {
    // En développement local, continuer à utiliser le chemin relatif
    apiUrl = '/api';
    console.log('Environnement de développement détecté - API URL:', apiUrl);
  }
  
  // Test de connexion immédiate pour diagnostiquer les problèmes de chemin
  console.log("URL API finale configurée:", apiUrl);
  console.log("URL API complète:", `${window.location.protocol}//${window.location.host}${apiUrl}`);
}

// Exécuter la détection au chargement
detectEnvironment();

// Obtenir l'URL de l'API configurée
export function getApiUrl(): string {
  return apiUrl;
}

// Obtenir l'URL complète de l'API (avec protocole et hôte)
export function getFullApiUrl(): string {
  return apiUrl.startsWith('http') 
    ? apiUrl 
    : `${window.location.protocol}//${window.location.host}${apiUrl}`;
}

// Définir une URL d'API personnalisée
export function setCustomApiUrl(url: string): void {
  apiUrl = url;
  isCustomUrl = true;
  console.log('URL API personnalisée définie:', url);
}

// Réinitialiser l'URL de l'API à la valeur par défaut
export function resetToDefaultApiUrl(): void {
  detectEnvironment();
  isCustomUrl = false;
  console.log('URL API réinitialisée à la valeur par défaut:', apiUrl);
}

// Vérifier si une URL d'API personnalisée est utilisée
export function isUsingCustomApiUrl(): boolean {
  return isCustomUrl;
}

// Vérifier si l'environnement est Infomaniak
export function isInfomaniakEnvironment(): boolean {
  return isInfomaniak;
}
