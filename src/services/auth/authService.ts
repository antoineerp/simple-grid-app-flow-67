
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
        console.log("Authentication service initialized");
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public setToken(token: string | null): void {
        this.token = token;
    }

    public getToken(): string | null {
        return this.token;
    }

    public getAuthHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Accept': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    private async parseJsonResponse(response: Response): Promise<any> {
        const responseText = await response.text();
        console.log(`Réponse reçue (${response.status}): ${responseText.substring(0, 200)}...`);
        
        // Si la réponse contient du code PHP, c'est que le serveur ne l'exécute pas
        if (responseText.includes('<?php')) {
            console.error('Le serveur renvoie du code PHP au lieu de l\'exécuter');
            throw new Error('Le serveur PHP n\'exécute pas le code. Vérifiez la configuration du serveur.');
        }
        
        if (!responseText || responseText.trim() === '') {
            console.warn('Réponse vide reçue du serveur');
            throw new Error('Réponse vide du serveur');
        }
        
        // Ne pas traiter la réponse de test comme une erreur, mais la reconnaître comme une réponse spéciale
        if (responseText.includes('API PHP disponible') && !responseText.includes('token')) {
            console.log('Détecté: réponse API info standard');
            return { info: true, message: 'API info response' };
        }
        
        if (responseText.trim().startsWith('<!DOCTYPE') || 
            responseText.trim().startsWith('<html') ||
            responseText.includes('<body')) {
            console.error('Réponse HTML reçue au lieu de JSON:', responseText.substring(0, 200));
            throw new Error('Le serveur a renvoyé une page HTML au lieu de JSON. Vérifiez la configuration du serveur.');
        }
        
        try {
            return JSON.parse(responseText);
        } catch (e) {
            console.error('Erreur lors du parsing JSON:', e);
            console.error('Texte reçu:', responseText.substring(0, 500));
            throw new Error('Réponse du serveur non valide. Format JSON attendu.');
        }
    }

    public async login(username: string, password: string): Promise<any> {
        try {
            console.log(`Tentative de connexion pour l'utilisateur: ${username}`);
            
            // Utiliser login-test.php directement sans essayer auth.php d'abord
            const authUrl = `${getApiUrl()}/login-test`;
            console.log(`URL de requête (authentification): ${authUrl}`);
            
            const response = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const errorData = await this.parseJsonResponse(response);
                throw new Error(errorData.message || `Échec de l'authentification (${response.status})`);
            }
            
            const data = await this.parseJsonResponse(response);
            
            if (!data || !data.token) {
                throw new Error(data?.message || "Authentification échouée");
            }
            
            this.setToken(data.token);
            
            if (data.user) {
                const displayName = 
                    (data.user.prenom && data.user.nom) 
                        ? `${data.user.prenom} ${data.user.nom}` 
                        : (data.user.email || data.user.identifiant_technique || 'Utilisateur');
                
                this.currentUser = data.user.identifiant_technique;
            }
            
            if (data.user && data.user.identifiant_technique) {
                await initializeUserData(data.user.identifiant_technique);
            }
            
            return {
                success: true,
                user: data.user
            };
        } catch (error) {
            console.error("Erreur lors de la connexion:", error);
            
            toast({
                title: "Échec de la connexion",
                description: error instanceof Error ? error.message : "Erreur inconnue",
                variant: "destructive",
            });
            
            throw error;
        }
    }

    public logout(): void {
        this.setToken(null);
        this.currentUser = null;
        disconnectUser();
        
        toast({
            title: "Déconnexion réussie",
            description: "Vous avez été déconnecté avec succès",
        });
    }

    public isLoggedIn(): boolean {
        return !!this.getToken();
    }

    public getCurrentUser(): string | null {
        return this.currentUser;
    }
}

const authService = AuthService.getInstance();

export const login = (username: string, password: string): Promise<any> => {
    return authService.login(username, password);
};

export const logout = (): void => {
    authService.logout();
};

export const isLoggedIn = (): boolean => {
    return authService.isLoggedIn();
};

export const getCurrentUser = (): string | null => {
    return authService.getCurrentUser();
};

export const getAuthHeaders = (): HeadersInit => {
    return authService.getAuthHeaders();
};

export const loginUser = login;
export const logoutUser = logout;
export const getToken = authService.getToken.bind(authService);
