
import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { disconnectUser } from '../core/database';
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
            localStorage.setItem('isLoggedIn', 'true');
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('isLoggedIn');
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

    private async parseJsonResponse(response: Response): Promise<any> {
        const responseText = await response.text();
        console.log(`Réponse reçue (${response.status}): ${responseText.substring(0, 200)}...`);
        
        if (!responseText || responseText.trim() === '') {
            console.warn('Réponse vide reçue du serveur');
            throw new Error('Réponse vide du serveur');
        }
        
        // Ne pas traiter la réponse de test comme une erreur
        if (responseText.includes('API PHP disponible') && !responseText.includes('token')) {
            console.log('Détecté: réponse API info standard');
            return { info: true, message: 'API info response' };
        }
        
        // Vérifier si la réponse est du PHP non exécuté
        if (responseText.trim().startsWith('<?php')) {
            console.error('Le serveur renvoie le code PHP au lieu de l\'exécuter');
            throw new Error('Le serveur renvoie le code PHP au lieu de l\'exécuter. Vérifiez la configuration du serveur PHP.');
        }
        
        // Vérifier si la réponse est du HTML au lieu de JSON
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
            console.log(`Type d'identifiant fourni: ${username.includes('@') ? 'Email' : 'Identifiant technique'}`);
            
            // Utilisez directement login-test.php qui fonctionne avec les emails également
            const authUrl = `${getApiUrl()}/login-test.php`;
            console.log(`URL de requête pour authentification: ${authUrl}`);
            
            const response = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                },
                body: JSON.stringify({ username, password })
            });
            
            console.log(`Réponse du serveur login-test: ${response.status} ${response.statusText}`);
            
            // Si la réponse n'est pas OK, essayer de parser le message d'erreur
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await this.parseJsonResponse(response);
                    throw new Error(errorData.message || `Échec de l'authentification (${response.status})`);
                } else {
                    throw new Error(`Échec de l'authentification (${response.status}): Format de réponse invalide`);
                }
            }
            
            // Analyser la réponse JSON
            const data = await this.parseJsonResponse(response);
            
            if (!data || !data.token) {
                throw new Error(data?.message || "Authentification échouée: Token manquant dans la réponse");
            }
            
            this.setToken(data.token);
            
            if (data.user) {
                localStorage.setItem('currentUser', data.user.identifiant_technique || data.user.email);
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('userName', `${data.user.prenom || ''} ${data.user.nom || ''}`);
                console.log("Utilisateur connecté:", data.user);
            }
            
            // Initialiser les données utilisateur
            const userIdentifiant = data.user?.identifiant_technique || username;
            await initializeUserData(userIdentifiant);
            
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
        localStorage.removeItem('isLoggedIn');
        
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
