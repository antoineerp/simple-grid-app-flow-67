
/**
 * Gère l'enregistrement et la communication avec le Service Worker
 */
class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isRegistering: boolean = false;
  
  /**
   * Enregistre le Service Worker
   */
  async register(): Promise<boolean> {
    // Vérifier si le navigateur supporte les Service Workers
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker non supporté par ce navigateur');
      return false;
    }
    
    // Éviter les enregistrements multiples simultanés
    if (this.isRegistering) {
      console.log('Enregistrement du Service Worker déjà en cours...');
      return false;
    }
    
    this.isRegistering = true;
    
    try {
      console.log('Tentative d\'enregistrement du Service Worker...');
      
      // Ajouter un timestamp pour éviter la mise en cache
      const scriptUrl = `/sync-service-worker.js?v=${Date.now()}`;
      
      this.registration = await navigator.serviceWorker.register(scriptUrl, {
        scope: '/',
        // Utiliser le type "module" peut aider avec les problèmes MIME sur certains serveurs
        type: 'classic' // ou 'module' si nécessaire
      });
      
      console.log('Service Worker enregistré avec succès:', this.registration.scope);
      this.setupMessageHandlers();
      return true;
    } catch (error) {
      console.error('Échec de l\'enregistrement du Service Worker:', error);
      
      // Vérifier spécifiquement les erreurs MIME
      if (error instanceof Error && error.message.includes('MIME type')) {
        console.error('Erreur de type MIME. Vérifiez que le serveur sert correctement le fichier JavaScript.');
        console.log('Conseil: Ajoutez la directive "AddType application/javascript .js" dans votre .htaccess');
      }
      
      return false;
    } finally {
      this.isRegistering = false;
    }
  }
  
  /**
   * Configure les gestionnaires de messages pour le Service Worker
   */
  private setupMessageHandlers(): void {
    if (!navigator.serviceWorker) return;
    
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'sync_complete':
          console.log('Synchronisation en arrière-plan terminée:', data);
          // Diffuser l'événement aux composants React
          window.dispatchEvent(new CustomEvent('background_sync_complete', { 
            detail: data 
          }));
          break;
          
        case 'sync_error':
          console.error('Erreur de synchronisation en arrière-plan:', data);
          window.dispatchEvent(new CustomEvent('background_sync_error', { 
            detail: data 
          }));
          break;
          
        default:
          console.log('Message du Service Worker:', event.data);
      }
    });
  }
  
  /**
   * Envoie un message au Service Worker
   */
  async sendMessage(message: any): Promise<boolean> {
    if (!this.registration || !this.registration.active) {
      console.warn('Service Worker non actif, impossible d\'envoyer un message');
      return false;
    }
    
    try {
      this.registration.active.postMessage(message);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message au Service Worker:', error);
      return false;
    }
  }
  
  /**
   * Déclenche une synchronisation en arrière-plan
   */
  async triggerBackgroundSync(syncType: string): Promise<boolean> {
    if (!this.registration) {
      await this.register();
      if (!this.registration) {
        return false;
      }
    }
    
    try {
      // Vérifier si la synchronisation en arrière-plan est supportée
      if ('sync' in this.registration) {
        await (this.registration.sync as any).register(`sync:${syncType}`);
        console.log(`Synchronisation en arrière-plan "${syncType}" enregistrée`);
        return true;
      } else {
        console.warn('API Background Sync non supportée par ce navigateur');
        // Effectuer une synchronisation immédiate via un message
        this.sendMessage({
          type: 'manual_sync',
          syncType
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la sync en arrière-plan:', error);
      return false;
    }
  }
  
  /**
   * Vérifie si le Service Worker est actif
   */
  isActive(): boolean {
    return !!this.registration && !!this.registration.active;
  }
  
  /**
   * Vérifie si le Service Worker est pris en charge et disponible
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }
  
  /**
   * Désinscrire le Service Worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;
    
    try {
      const result = await this.registration.unregister();
      this.registration = null;
      console.log('Service Worker désinscrit:', result);
      return result;
    } catch (error) {
      console.error('Erreur lors de la désinscription du Service Worker:', error);
      return false;
    }
  }

  /**
   * Met à jour le Service Worker
   */
  async update(): Promise<boolean> {
    if (!this.registration) {
      return await this.register();
    }
    
    try {
      await this.registration.update();
      console.log('Service Worker mis à jour');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du Service Worker:', error);
      return false;
    }
  }
}

// Exporter une instance singleton
export const serviceWorkerManager = new ServiceWorkerManager();
