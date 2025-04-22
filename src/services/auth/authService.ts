
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
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Accept': 'application/json'
        };
        
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    // Fonction utilitaire pour valider et parser les réponses JSON
    private async parseJsonResponse(response: Response): Promise<any> {
        const responseText = await response.text();
        console.log(`Réponse reçue (${response.status}): ${responseText.substring(0, 200)}...`);
        
        if (!responseText || responseText.trim() === '') {
            console.warn('Réponse vide reçue du serveur');
            throw new Error('Réponse vide du serveur');
        }
        
        // Vérifier si la réponse est le message de test de l'API
        if (responseText.includes('API PHP disponible')) {
            throw new Error('Le serveur a renvoyé une réponse de test au lieu du traitement de la connexion');
        }
        
        // Vérifier si la réponse n'est pas du JSON (probablement du HTML)
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
            
            // Tester avec login-test.php d'abord (plus fiable)
            const testUrl = `${getApiUrl()}/login-test.php`;
            console.log(`URL de requête (test): ${testUrl}`);
            
            let response;
            let data;
            let connectionSuccessful = false;
            
            try {
                response = await fetch(testUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                if (response.ok) {
                    data = await this.parseJsonResponse(response);
                    connectionSuccessful = true;
                    console.log('Connexion réussie via login-test.php');
                } else {
                    const errorText = await response.text();
                    console.warn('Échec avec login-test.php:', errorText);
                }
            } catch (testError) {
                console.warn('Échec avec login-test.php, tentative avec AuthController:', testError);
            }
            
            // Si le test a échoué, essayer avec le contrôleur principal
            if (!connectionSuccessful) {
                const url = `${getApiUrl()}/index.php`;
                console.log(`URL de requête (principale): ${url}`);
                
                response = await fetch(url, {
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
                
                data = await this.parseJsonResponse(response);
            }
            
            if (!data || !data.token) {
                throw new Error(data?.message || "Authentification échouée");
            }
            
            // Stocker le token
            this.setToken(data.token);
            
            // Stocker les informations utilisateur
            if (data.user) {
                localStorage.setItem('currentUser', data.user.identifiant_technique);
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('userName', `${data.user.prenom || ''} ${data.user.nom || ''}`);
            }
            
            // Initialiser les données utilisateur si nécessaire
            if (data.user && data.user.identifiant_technique) {
                await initializeUserData(data.user.identifiant_technique);
            }
            
            // Retourner les données de l'utilisateur
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
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        
        // Déconnecter l'utilisateur de la base de données
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
        return this.currentUser || localStorage.getItem('currentUser');
    }
}

// Export the authentication service instance
const authService = AuthService.getInstance();

// Export simplified functions for easier usage
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

// Alias exports to match the imported names in services/index.ts
export const loginUser = login;
export const logoutUser = logout;
export const getToken = authService.getToken.bind(authService);
