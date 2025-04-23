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
            console.log(`Response status: ${response.status}, Content-Type: ${response.headers.get('Content-Type')}`);
            
            const responseText = await response.text();
            console.log(`Réponse brute reçue (${responseText.length} caractères):`);
            console.log(responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
            
            if (!responseText || responseText.trim() === '') {
                console.warn('Réponse vide reçue du serveur');
                throw new Error('Réponse vide du serveur');
            }
            
            let cleanResponseText = responseText;
            if (responseText.charCodeAt(0) === 0xFEFF) {
                console.log('BOM détecté et retiré de la réponse');
                cleanResponseText = responseText.slice(1);
            }
            
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
            
            if (responseText.trim().startsWith('<?php')) {
                console.error('Code PHP non exécuté reçu:', responseText.substring(0, 200));
                throw new Error('Le serveur renvoie le code PHP au lieu de l\'exécuter. Vérifiez la configuration Apache et .htaccess.');
            }
            
            try {
                return JSON.parse(cleanResponseText);
            } catch (e) {
                console.error('Erreur lors du parsing JSON:', e);
                console.error('Texte reçu:', responseText.substring(0, 500));
                
                const jsonMatch = responseText.match(/(\{.*\}|\[.*\])/);
                if (jsonMatch) {
                    console.log('Tentative de récupération d\'un JSON valide dans la réponse');
                    try {
                        return JSON.parse(jsonMatch[0]);
                    } catch {
                        console.error('Échec de la tentative de récupération JSON');
                    }
                }
                
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
            
            try {
                const testUrl = `${getApiUrl()}/php-simple-test.php?t=${Date.now()}`;
                console.log(`Vérification préalable de l'exécution PHP: ${testUrl}`);
                
                const phpTestResponse = await fetch(testUrl, {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                
                if (phpTestResponse.ok) {
                    const phpTestText = await phpTestResponse.text();
                    console.log(`Test PHP préalable: ${phpTestText.substring(0, 100)}...`);
                    
                    if (phpTestText.includes('success')) {
                        console.log('Vérification PHP réussie, poursuite de la connexion');
                    } else if (phpTestText.trim().startsWith('<?php')) {
                        console.warn('PHP ne s\'exécute pas correctement sur le serveur');
                    }
                } else {
                    console.warn(`Test PHP échoué: ${phpTestResponse.status}`);
                }
            } catch (phpError) {
                console.warn('Erreur lors du test PHP préalable:', phpError);
                // On continue malgré l'erreur
            }
            
            const loginUrl = `${getApiUrl()}/login-test.php`;
            console.log(`Tentative de connexion avec login-test.php: ${loginUrl}`);
            
            try {
                const response = await fetch(loginUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                console.log(`Réponse login-test: ${response.status} ${response.statusText}`);
                console.log('Headers:', Object.fromEntries([...response.headers.entries()]));
                
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
                
                const authUrl = `${getApiUrl()}/auth`;
                console.log(`Seconde tentative avec /auth: ${authUrl}`);
                
                const response = await fetch(authUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                console.log(`Réponse auth: ${response.status} ${response.statusText}`);
                
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
