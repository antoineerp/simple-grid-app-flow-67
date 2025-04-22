
import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { disconnectUser } from '../core/databaseConnectionService';
import { initializeUserData } from '../core/userInitializationService';

const API_URL = getApiUrl();

class AuthService {
    private static instance: AuthService;
    private token: string | null = null;
    private currentUser: string | null = null;

    private constructor() {
        console.log("Service d'authentification initialisé");
        this.token = localStorage.getItem('authToken');
        this.currentUser = localStorage.getItem('currentUser');
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
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
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
            console.log(`Tentative de connexion pour l'utilisateur: ${username}`);
            
            const response = await fetch(`${currentApiUrl}/auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Erreur HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.token || !data.user) {
                throw new Error("Réponse d'authentification invalide");
            }

            // Stocker les informations de l'utilisateur de manière cohérente
            this.setToken(data.token);
            this.currentUser = username;
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('currentUser', username);
            localStorage.setItem('userTechnicalId', data.user.identifiant_technique);
            localStorage.setItem('isLoggedIn', 'true');
            
            await initializeUserData(data.user.identifiant_technique || username);
            
            return {
                success: true,
                user: data.user
            };
        } catch (error) {
            console.error("Erreur d'authentification:", error);
            throw error;
        }
    }

    public logout(): void {
        this.setToken(null);
        this.currentUser = null;
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userTechnicalId');
        localStorage.removeItem('isLoggedIn');
        disconnectUser();
        
        console.log("Déconnexion effectuée avec succès");
    }
}

const authService = AuthService.getInstance();

export const loginUser = async (username: string, password: string): Promise<any> => {
    try {
        return await authService.login(username, password);
    } catch (error) {
        toast({
            title: "Erreur de connexion",
            description: error instanceof Error ? error.message : "Erreur inconnue lors de la connexion",
            variant: "destructive",
        });
        throw error;
    }
};

export const logoutUser = (): void => {
    authService.logout();
    toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
    });
};

export const getToken = (): string | null => {
    return authService.getToken();
};

export const getAuthHeaders = (): HeadersInit => {
    return authService.getAuthHeaders();
};
