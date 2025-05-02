
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

// Interface pour la configuration du serveur
export interface ServerConfig {
  host: string;
  database: string;
  apiBasePath: string;
  isInfomaniak: boolean;
}

// Cache pour éviter trop d'appels au serveur
let cachedServerConfig: ServerConfig | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 heure

/**
 * Obtient la configuration dynamique du serveur
 */
export async function getServerConfig(): Promise<ServerConfig> {
  const now = Date.now();
  
  // Vérifier si nous avons une configuration en cache récente
  if (cachedServerConfig && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedServerConfig;
  }
  
  try {
    // Détection automatique si nous sommes sur Infomaniak
    const isInfomaniak = window.location.hostname.includes('qualiopi.ch') || 
                        window.location.hostname.includes('myd.infomaniak.com');
    
    if (!isInfomaniak) {
      // En mode développement, retourner une configuration par défaut
      console.log('Développement local détecté - utilisation de la configuration par défaut');
      
      cachedServerConfig = {
        host: 'p71x6d.myd.infomaniak.com',
        database: 'p71x6d_system',
        apiBasePath: '/api',
        isInfomaniak: false
      };
      
      lastFetchTime = now;
      return cachedServerConfig;
    }
    
    console.log('Infomaniak détecté - récupération de la configuration du serveur');
    
    // Récupérer la configuration depuis le serveur
    const response = await fetch(`${getApiUrl()}/database-config.php`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    cachedServerConfig = {
      host: data.config?.host || 'p71x6d.myd.infomaniak.com',
      database: data.config?.database || 'p71x6d_system',
      apiBasePath: '/api',
      isInfomaniak: true
    };
    
    lastFetchTime = now;
    return cachedServerConfig;
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration du serveur:', error);
    
    // En cas d'erreur, utiliser une configuration par défaut mais ne pas la mettre en cache
    return {
      host: 'p71x6d.myd.infomaniak.com',
      database: 'p71x6d_system',
      apiBasePath: '/api',
      isInfomaniak: window.location.hostname.includes('qualiopi.ch') || 
                   window.location.hostname.includes('myd.infomaniak.com')
    };
  }
}

/**
 * Vide le cache de la configuration du serveur
 */
export function clearServerConfigCache(): void {
  cachedServerConfig = null;
  lastFetchTime = 0;
}
