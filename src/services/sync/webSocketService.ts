
import { SYNC_CONFIG } from './syncConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Types de messages WebSocket
 */
export enum WebSocketMessageType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  SYNC_REQUEST = 'sync_request',
  SYNC_RESPONSE = 'sync_response',
  SYNC_ERROR = 'sync_error',
  DATA_UPDATE = 'data_update',
  PING = 'ping',
  PONG = 'pong'
}

/**
 * Structure d'un message WebSocket
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  entityType?: string;
  data?: any;
  timestamp: number;
  userId?: string;
}

/**
 * Service de gestion des WebSockets
 */
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnecting: boolean = false;
  private messageListeners: Map<string, Function[]> = new Map();
  private userId: string | null = null;
  
  /**
   * Initialise la connexion WebSocket
   */
  connect(userId: string): void {
    if (this.ws || this.isConnecting) return;
    
    this.userId = userId;
    this.isConnecting = true;
    
    try {
      // Récupérer le token d'authentification
      const headers = getAuthHeaders();
      const authToken = headers.Authorization || '';
      
      // Créer l'URL WebSocket avec le token
      const url = new URL(SYNC_CONFIG.wsUrl);
      url.searchParams.append('userId', userId);
      if (authToken) {
        url.searchParams.append('token', authToken.replace('Bearer ', ''));
      }
      
      this.ws = new WebSocket(url.toString());
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      
      // Démarrer les pings pour maintenir la connexion
      this.startPingInterval();
    } catch (error) {
      console.error('Erreur lors de la création de la connexion WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }
  
  /**
   * Gère l'ouverture de la connexion
   */
  private handleOpen(): void {
    console.log('Connexion WebSocket établie');
    this.isConnecting = false;
    
    // Envoyer un message de connexion
    if (this.userId) {
      this.sendMessage({
        type: WebSocketMessageType.CONNECT,
        userId: this.userId,
        timestamp: Date.now()
      });
    }
    
    // Notifier les abonnés
    this.notifyListeners(WebSocketMessageType.CONNECT, { connected: true });
  }
  
  /**
   * Gère la fermeture de la connexion
   */
  private handleClose(event: CloseEvent): void {
    console.log(`Connexion WebSocket fermée: ${event.code} - ${event.reason}`);
    this.isConnecting = false;
    this.ws = null;
    
    // Notifier les abonnés
    this.notifyListeners(WebSocketMessageType.DISCONNECT, { 
      code: event.code, 
      reason: event.reason 
    });
    
    // Planifier une reconnexion
    this.scheduleReconnect();
  }
  
  /**
   * Gère les messages entrants
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Répondre aux pings
      if (message.type === WebSocketMessageType.PING) {
        this.sendMessage({
          type: WebSocketMessageType.PONG,
          timestamp: Date.now(),
          userId: this.userId || undefined
        });
        return;
      }
      
      // Notifier les abonnés du message
      this.notifyListeners(message.type, message);
      
      // Si c'est une mise à jour de données, notifier également les abonnés spécifiques
      if (message.type === WebSocketMessageType.DATA_UPDATE && message.entityType) {
        this.notifyListeners(`${WebSocketMessageType.DATA_UPDATE}:${message.entityType}`, message);
      }
    } catch (error) {
      console.error('Erreur lors du traitement du message WebSocket:', error);
    }
  }
  
  /**
   * Gère les erreurs de connexion
   */
  private handleError(event: Event): void {
    console.error('Erreur WebSocket:', event);
    this.notifyListeners(WebSocketMessageType.SYNC_ERROR, { 
      error: 'Erreur de connexion WebSocket' 
    });
  }
  
  /**
   * Planifie une tentative de reconnexion
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('Tentative de reconnexion WebSocket...');
      if (this.userId) {
        this.connect(this.userId);
      }
    }, SYNC_CONFIG.reconnectInterval);
  }
  
  /**
   * Démarre l'intervalle de ping pour maintenir la connexion active
   */
  private startPingInterval(): void {
    setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: WebSocketMessageType.PING,
          timestamp: Date.now(),
          userId: this.userId || undefined
        });
      }
    }, 30000); // Ping toutes les 30 secondes
  }
  
  /**
   * Envoie un message via WebSocket
   */
  sendMessage(message: Partial<WebSocketMessage>): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Impossible d\'envoyer un message: WebSocket non connecté');
      return false;
    }
    
    try {
      const completeMessage: WebSocketMessage = {
        type: message.type || WebSocketMessageType.SYNC_REQUEST,
        timestamp: message.timestamp || Date.now(),
        userId: message.userId || this.userId || undefined,
        entityType: message.entityType,
        data: message.data
      };
      
      this.ws.send(JSON.stringify(completeMessage));
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message WebSocket:', error);
      return false;
    }
  }
  
  /**
   * Demande une synchronisation des données
   */
  requestSync(entityType: string, data?: any): boolean {
    return this.sendMessage({
      type: WebSocketMessageType.SYNC_REQUEST,
      entityType,
      data,
      timestamp: Date.now(),
      userId: this.userId || undefined
    });
  }
  
  /**
   * S'abonne aux messages d'un type spécifique
   */
  subscribe(messageType: string, callback: Function): void {
    if (!this.messageListeners.has(messageType)) {
      this.messageListeners.set(messageType, []);
    }
    
    this.messageListeners.get(messageType)?.push(callback);
  }
  
  /**
   * Se désabonne des messages d'un type spécifique
   */
  unsubscribe(messageType: string, callback: Function): void {
    if (!this.messageListeners.has(messageType)) return;
    
    const listeners = this.messageListeners.get(messageType) || [];
    const index = listeners.indexOf(callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  /**
   * Notifie les abonnés d'un message
   */
  private notifyListeners(messageType: string, data: any): void {
    const listeners = this.messageListeners.get(messageType) || [];
    
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Erreur dans un écouteur WebSocket (${messageType}):`, error);
      }
    });
  }
  
  /**
   * Vérifie si la connexion WebSocket est active
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
  
  /**
   * Ferme la connexion WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      // Envoyer un message de déconnexion
      if (this.ws.readyState === WebSocket.OPEN && this.userId) {
        this.sendMessage({
          type: WebSocketMessageType.DISCONNECT,
          userId: this.userId,
          timestamp: Date.now()
        });
      }
      
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.userId = null;
    console.log('Connexion WebSocket fermée');
  }
}

// Exporter une instance singleton
export const webSocketService = new WebSocketService();
