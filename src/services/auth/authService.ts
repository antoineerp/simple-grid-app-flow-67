
import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { disconnectUser } from '../core/databaseConnectionService';
import { initializeUserData } from '../core/userInitializationService';

const API_URL = getApiUrl();

class AuthService {
    private static instance: AuthService;
    private token: string | null = null;

    private constructor() {
        console.log("Authentication service initialized");
        this.token = localStorage.getItem('authToken');
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public setToken(token: string | null): void {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    public getToken(): string | null {
        if (!this.token) {
            this.token = localStorage.getItem('authToken');
        }
        return this.token;
    }

    public getAuthHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };
        
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    public async login(username: string, password: string): Promise<any> {
        try {
            const currentApiUrl = getApiUrl();
            console.log(`Tentative de connexion à l'API: ${currentApiUrl}/auth.php`);
            
            const cacheBuster = new Date().getTime();
            const loginUrl = `${currentApiUrl}/auth.php?_=${cacheBuster}`;
            
            console.log("URL de l'API utilisée:", loginUrl);
            console.log("Données de connexion:", { username });
            
            // Utiliser un objet AbortController avec un timeout de 10 secondes
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                signal: controller.signal,
                cache: 'no-cache'
            });
            
            // Annuler le timeout
            clearTimeout(timeoutId);
            
            console.log("Type de contenu reçu:", response.headers.get('Content-Type'));
            console.log("Code de statut HTTP:", response.status);
            
            // Récupérer le texte brut de la réponse
            const responseText = await response.text();
            
            // Vérifier si la réponse est vide ou non-valide
            if (!responseText || responseText.trim() === '') {
                console.error("Le serveur a renvoyé une réponse vide");
                return {
                    success: false,
                    error: "Le serveur a renvoyé une réponse vide"
                };
            }
            
            console.log("Contenu reçu:", responseText.substring(0, 200));
            
            // Essayer de parser la réponse JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Erreur d'analyse JSON:", parseError);
                console.log("Contenu non-JSON reçu:", responseText);
                return {
                    success: false,
                    error: "Format de réponse invalide. Vérifiez que PHP est correctement configuré."
                };
            }
            
            if (!response.ok) {
                const errorMessage = data?.message || `Erreur HTTP ${response.status}`;
                console.error("Erreur API:", errorMessage);
                return {
                    success: false,
                    error: errorMessage
                };
            }
            
            if (data && data.token && data.user) {
                this.setToken(data.token);
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('currentUser', data.user.identifiant_technique || username);
                localStorage.setItem('isLoggedIn', 'true');
                
                const userId = data.user.identifiant_technique || username;
                await initializeUserData(userId);
                
                return {
                    success: true,
                    user: data.user
                };
            } else {
                console.error("Réponse d'authentification incomplète:", data);
                return {
                    success: false,
                    error: "Réponse d'authentification incomplète"
                };
            }
        } catch (error) {
            console.error("Erreur d'authentification:", error);
            
            // Gérer les erreurs spécifiques
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                return {
                    success: false,
                    error: "Impossible de contacter le serveur d'authentification"
                };
            }
            
            if (error instanceof DOMException && error.name === 'AbortError') {
                return {
                    success: false,
                    error: "La requête a expiré - le serveur met trop de temps à répondre"
                };
            }
            
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erreur d'authentification inconnue"
            };
        }
    }

    public logout(): void {
        this.setToken(null);
        localStorage.removeItem('userRole');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        disconnectUser();
        
        console.log("Déconnexion effectuée");
    }
}

const authService = AuthService.getInstance();

export const loginUser = (username: string, password: string): Promise<any> => {
    return authService.login(username, password);
};

export const logoutUser = (): void => {
    authService.logout();
};

export const getToken = (): string | null => {
    return authService.getToken();
};

export const getAuthHeaders = (): HeadersInit => {
    return authService.getAuthHeaders();
};
