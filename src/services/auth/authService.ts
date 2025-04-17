
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
            console.log(`Tentative de connexion à l'API: ${currentApiUrl}/login`);
            
            const cacheBuster = new Date().getTime();
            const loginUrl = `${currentApiUrl}/login?_=${cacheBuster}`;
            
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                },
                body: JSON.stringify({ username, password }),
                cache: 'no-cache'
            });
            
            console.log("Réponse de l'API reçue:", response.status, response.statusText);
            
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error("Erreur de parsing JSON:", parseError);
                throw new Error("Réponse invalide du serveur");
            }

            if (!response.ok) {
                throw new Error(data.message || `Erreur HTTP ${response.status}`);
            }
            
            if (data.token && data.user) {
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
                throw new Error("Réponse d'authentification invalide");
            }
        } catch (error) {
            console.error("Erreur d'authentification:", error);
            
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
