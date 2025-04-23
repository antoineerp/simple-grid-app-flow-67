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
        // Récupérer les valeurs du localStorage une seule fois à l'initialisation
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
        try {
            const responseText = await response.text();
            console.log(`Réponse reçue (${response.status}): ${responseText.substring(0, 200)}...`);
            
            // Si la réponse est vide
            if (!responseText || responseText.trim() === '') {
                console.warn('Réponse vide reçue du serveur');
                throw new Error('Réponse vide du serveur');
            }
            
            // Vérifier si la réponse commence par un caractère spécial BOM
            let cleanResponseText = responseText;
            if (responseText.charCodeAt(0) === 0xFEFF) {
                console.log('BOM détecté et retiré de la réponse');
                cleanResponseText = responseText.slice(1);
            }
            
            // Ne pas traiter la réponse de test comme une erreur
            if (responseText.includes('API PHP disponible') && !responseText.includes('token')) {
                console.log('Détecté: réponse API info standard');
                return { info: true, message: 'API info response' };
            }
            
            // Vérifier si la réponse est du HTML ou PHP non exécuté
            if (responseText.trim().startsWith('<!DOCTYPE') || 
                responseText.trim().startsWith('<html') ||
                responseText.includes('<body')) {
                console.error('Réponse HTML reçue au lieu de JSON:', responseText.substring(0, 200));
                throw new Error('Le serveur a renvoyé une page HTML au lieu de JSON. Vérifiez la configuration du serveur.');
            }
            
            // Vérifier si la réponse est du PHP non-exécuté
            if (responseText.trim().startsWith('<?php')) {
                console.error('Code PHP non exécuté reçu:', responseText.substring(0, 200));
                throw new Error('Le serveur renvoie le code PHP au lieu de l\'exécuter. Vérifiez la configuration Apache et .htaccess.');
            }
            
            try {
                return JSON.parse(cleanResponseText);
            } catch (e) {
                console.error('Erreur lors du parsing JSON:', e);
                console.error('Texte reçu:', responseText.substring(0, 500));
                throw new Error('Réponse du serveur non valide. Format JSON attendu.');
            }
        } catch (e) {
            console.error('Erreur lors du traitement de la réponse:', e);
            throw e;
        }
    }

    public async login(username: string, password: string): Promise<any> {
        try {
            console.log(`Tentative de connexion pour l'utilisateur: ${username}`);
            
            // Essayer directement une API simplifiée pour le test de login
            const testUrl = `${getApiUrl()}/php-simple-test.php`;
            console.log(`Test d'exécution PHP avec: ${testUrl}`);
            
            try {
                // Vérifier d'abord que PHP s'exécute correctement
                const phpTestResponse = await fetch(testUrl, {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                });
                
                const phpTestText = await phpTestResponse.text();
                console.log('Test PHP response:', phpTestText.substring(0, 100));
                
                if (phpTestText.trim().startsWith('<?php')) {
                    throw new Error('PHP n\'est pas exécuté correctement sur le serveur');
                }
            } catch (phpError) {
                console.error('Erreur lors du test PHP:', phpError);
                // Continuer malgré l'erreur pour essayer le login quand même
            }
            
            // Essayer d'abord le fichier login-test.php spécifique, qui est plus simple
            const loginUrl = `${getApiUrl()}/login-test.php`;
            console.log(`URL de requête (login-test): ${loginUrl}`);
            
            try {
                const response = await fetch(loginUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                console.log(`Réponse du serveur login-test: ${response.status} ${response.statusText}`);
                
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
                    localStorage.setItem('currentUser', data.user.identifiant_technique);
                    localStorage.setItem('userRole', data.user.role);
                    localStorage.setItem('userName', `${data.user.prenom || ''} ${data.user.nom || ''}`);
                }
                
                if (data.user && data.user.identifiant_technique) {
                    await initializeUserData(data.user.identifiant_technique);
                }
                
                return {
                    success: true,
                    user: data.user
                };
            } catch (testError) {
                console.error("Erreur avec login-test.php:", testError);
                
                // Si le login-test.php échoue, essayer avec /auth
                const authUrl = `${getApiUrl()}/auth`;
                console.log(`URL de requête (auth): ${authUrl}`);
                
                const response = await fetch(authUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                console.log(`Réponse du serveur auth: ${response.status} ${response.statusText}`);
                
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
                    localStorage.setItem('currentUser', data.user.identifiant_technique);
                    localStorage.setItem('userRole', data.user.role);
                    localStorage.setItem('userName', `${data.user.prenom || ''} ${data.user.nom || ''}`);
                }
                
                if (data.user && data.user.identifiant_technique) {
                    await initializeUserData(data.user.identifiant_technique);
                }
                
                return {
                    success: true,
                    user: data.user
                };
            }
        } catch (error) {
            console.error("Erreur lors de la connexion:", error);
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
