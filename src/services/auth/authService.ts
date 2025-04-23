
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
        const responseText = await response.text();
        console.log(`Réponse reçue (${response.status}): ${responseText.substring(0, 200)}...`);
        
        // Si la réponse est vide
        if (!responseText || responseText.trim() === '') {
            console.warn('Réponse vide reçue du serveur');
            throw new Error('Réponse vide du serveur');
        }
        
        // Vérifier si la réponse commence par un caractère spécial BOM (Byte Order Mark)
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
        
        // Vérifier si la réponse est du HTML (ce qui indiquerait que le PHP n'est pas exécuté)
        if (responseText.trim().startsWith('<!DOCTYPE') || 
            responseText.trim().startsWith('<html') ||
            responseText.includes('<body')) {
            console.error('Réponse HTML reçue au lieu de JSON:', responseText.substring(0, 200));
            throw new Error('Le serveur a renvoyé une page HTML au lieu de JSON. Vérifiez la configuration du serveur.');
        }
        
        // Vérifier si la réponse est du PHP non-exécuté (ce qui indique un problème de configuration Apache)
        if (responseText.trim().startsWith('<?php')) {
            console.error('Code PHP non exécuté reçu:', responseText.substring(0, 200));
            throw new Error('Le serveur renvoie le code PHP au lieu de l\'exécuter. Vérifiez la configuration Apache et .htaccess.');
        }
        
        try {
            return JSON.parse(cleanResponseText);
        } catch (e) {
            console.error('Erreur lors du parsing JSON:', e);
            console.error('Texte reçu:', responseText.substring(0, 500));
            
            // Essayer de déterminer pourquoi le parsing a échoué
            if (responseText.includes('Warning:') || responseText.includes('Fatal error:') || responseText.includes('Parse error:')) {
                console.error('Erreur PHP détectée dans la réponse');
                throw new Error('Erreur PHP détectée dans la réponse. Vérifiez les logs serveur.');
            }
            
            throw new Error('Réponse du serveur non valide. Format JSON attendu.');
        }
    }

    // Méthode de connexion - uniquement appelée sur action explicite de l'utilisateur
    public async login(username: string, password: string): Promise<any> {
        try {
            console.log(`Tentative de connexion pour l'utilisateur: ${username}`);
            
            // Essayer d'abord le fichier login-test.php spécifique, qui est plus simple
            const testUrl = `${getApiUrl()}/login-test.php`;
            console.log(`URL de requête (login-test): ${testUrl}`);
            
            try {
                const response = await fetch(testUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
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
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
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

    // Méthode de déconnexion
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

// Exporter les méthodes d'authentification
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
