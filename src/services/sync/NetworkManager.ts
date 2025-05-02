
/**
 * Gestionnaire réseau pour la synchronisation
 * Gère la détection de connectivité et les événements réseau
 */

export class NetworkManager {
  private _isOnline: boolean;
  private onlineStatusListeners: Set<(status: boolean) => void>;
  
  constructor() {
    this._isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.onlineStatusListeners = new Set();
    
    // Configurer les écouteurs d'événements si on est dans un navigateur
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.updateOnlineStatus(true));
      window.addEventListener('offline', () => this.updateOnlineStatus(false));
    }
  }
  
  /**
   * Retourne l'état actuel de la connexion
   */
  isOnline(): boolean {
    return this._isOnline;
  }
  
  /**
   * Ajoute un écouteur pour les changements de statut réseau
   */
  addOnlineStatusListener(listener: (status: boolean) => void): () => void {
    this.onlineStatusListeners.add(listener);
    
    // Retourner une fonction pour supprimer l'écouteur
    return () => {
      this.onlineStatusListeners.delete(listener);
    };
  }
  
  /**
   * Met à jour le statut et notifie les écouteurs
   */
  private updateOnlineStatus(status: boolean): void {
    if (this._isOnline !== status) {
      this._isOnline = status;
      
      console.log(`[NetworkManager] État de connexion changé: ${status ? 'En ligne' : 'Hors ligne'}`);
      
      // Notifier tous les écouteurs
      this.onlineStatusListeners.forEach(listener => {
        try {
          listener(status);
        } catch (error) {
          console.error('[NetworkManager] Erreur dans un écouteur:', error);
        }
      });
      
      // Déclencher un événement personnalisé
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(
          status ? 'connectivity-restored' : 'connectivity-lost'
        ));
      }
    }
  }
  
  /**
   * Teste la connectivité réelle en effectuant une requête
   * Plus fiable que la propriété navigator.onLine
   */
  async testConnectivity(url?: string): Promise<boolean> {
    try {
      const testUrl = url || '/api/ping.php';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(testUrl, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const online = response.ok;
      this.updateOnlineStatus(online);
      return online;
    } catch (error) {
      console.warn('[NetworkManager] Test de connectivité échoué:', error);
      
      // En cas d'échec, on considère qu'on est hors ligne
      this.updateOnlineStatus(false);
      return false;
    }
  }
}
