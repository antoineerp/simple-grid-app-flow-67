
/**
 * Gestion de la détection d'environnement (Infomaniak, dev, etc)
 */

let apiUrl = '/api';
let isCustomUrl = false;

export function detectEnvironment() {
  const hostname = window.location.hostname;
  const isInfomaniak = hostname.includes('myd.infomaniak.com') || 
                       hostname.includes('qualiopi.ch');
  
  console.log('Détection d\'environnement - Hostname:', hostname);
  console.log('Détection d\'environnement - Est Infomaniak:', isInfomaniak);
  
  if (isInfomaniak) {
    apiUrl = '/api';
    console.log('Environnement Infomaniak détecté - API URL:', apiUrl);
  } else {
    apiUrl = '/api';
    console.log('Environnement de développement détecté - API URL:', apiUrl);
  }
}

detectEnvironment();

export function getApiUrl(): string {
  return apiUrl;
}

export function getFullApiUrl(): string {
  return apiUrl.startsWith('http') 
    ? apiUrl 
    : `${window.location.protocol}//${window.location.host}${apiUrl}`;
}

export function setCustomApiUrl(url: string): void {
  apiUrl = url;
  isCustomUrl = true;
  console.log('URL API personnalisée définie:', url);
}

export function resetToDefaultApiUrl(): void {
  detectEnvironment();
  isCustomUrl = false;
  console.log('URL API réinitialisée à la valeur par défaut:', apiUrl);
}

export function isUsingCustomApiUrl(): boolean {
  return isCustomUrl;
}
