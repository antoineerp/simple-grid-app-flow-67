
import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { disconnectUser } from '../core/databaseConnectionService';
import { initializeUserData } from '../core/userInitializationService';

const API_URL = getApiUrl();

class AuthService {
    private static instance: AuthService;
    private token: string | null = null;
    private currentUser: string | null = null;
    private authEndpoint: string = 'auth.php';
    private fallbackAttempted: boolean = false;

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

    public async login(username: string, password: string): Promise<any> {
        try {
            const currentApiUrl = getApiUrl();
            console.log(`Tentative de connexion pour l'utilisateur: ${username}`);
            
            // Définir l'endpoint d'authentification
            const endpoint = this.fallbackAttempted ? 'login-test.php' : this.authEndpoint;
            console.log(`Tentative de connexion à l'API: ${currentApiUrl}/${endpoint}`);
            
            // Add a cache-busting parameter to ensure we're not getting cached responses
            const timestamp = new Date().getTime();
            const url = `${currentApiUrl}/${endpoint}?_=${timestamp}`;
            console.log(`URL de requête complète: ${url}`);
            
            // Log the request payload and headers (without password)
            console.log(`Données de connexion: ${JSON.stringify({username})}`);
            
            const headers = {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Accept': 'application/json'
            };
            
            console.log(`En-têtes de la requête: ${JSON.stringify(headers)}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ username, password })
            });

            console.log(`Réponse de l'API reçue: ${response.status} ${response.statusText}`);
            console.log(`Type de contenu reçu: ${response.headers.get('Content-Type')}`);
            
            // Get the raw response text for debugging
            const responseText = await response.text();
            console.log(`Texte de réponse brut: ${responseText}`);
            
            // Essayer de parser la réponse comme JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Erreur de parsing JSON:", parseError);
                
                // Si on n'a pas encore essayé le fallback et qu'on a une erreur de parsing
                // ou une réponse 404, essayer avec le fallback
                if (!this.fallbackAttempted && (response.status === 404 || parseError)) {
                    console.log("Échec de la requête principale, tentative avec le endpoint de fallback");
                    this.fallbackAttempted = true;
                    return this.login(username, password);
                }
                
                throw new Error(`Réponse invalide du serveur: ${responseText.substring(0, 100)}...`);
            }
            
            // Réinitialiser le flag fallback en cas de succès
            this.fallbackAttempted = false;
            
            // Check for database connection error pattern
            if (!response.ok) {
                const errorMessage = data?.error || data?.message || `Erreur HTTP ${response.status}`;
                
                // Detect database connection issues
                if (errorMessage.includes("connexion à la base de données") || 
                    errorMessage.includes("Access denied for user") ||
                    errorMessage.includes("database connection")) {
                    
                    throw new Error("Erreur de connexion à la base de données. Veuillez contacter l'administrateur système.");
                }
                
                throw new Error(errorMessage);
            }

            if (!data.token || !data.user) {
                throw new Error("Réponse d'authentification invalide");
            }

            // Stocker les informations de l'utilisateur de manière cohérente
            this.setToken(data.token);
            this.currentUser = username;
            localStorage.setItem('userRole', data.user.role || 'user');
            localStorage.setItem('currentUser', username);
            localStorage.setItem('userTechnicalId', data.user.identifiant_technique || username);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', data.user.nom || username);
            localStorage.setItem('userFirstName', data.user.prenom || '');
            
            await initializeUserData(data.user.identifiant_technique || username);
            
            return {
                success: true,
                user: data.user
            };
        } catch (error) {
            console.error("Erreur API:", error instanceof Error ? error.message : "Erreur inconnue");
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
        localStorage.removeItem('userName');
        localStorage.removeItem('userFirstName');
        disconnectUser();
        
        console.log("Déconnexion effectuée avec succès");
    }
}

const authService = AuthService.getInstance();

export const loginUser = async (username: string, password: string): Promise<any> => {
    try {
        return await authService.login(username, password);
    } catch (error) {
        // Provide user-friendly error messages based on error type
        let errorMessage = "Erreur inconnue lors de la connexion";
        
        if (error instanceof Error) {
            errorMessage = error.message;
            
            // Override with more user-friendly messages for specific cases
            if (error.message.includes("Erreur de connexion à la base de données")) {
                errorMessage = "Impossible de se connecter à la base de données. Le service est temporairement indisponible. Veuillez réessayer ultérieurement ou contacter l'administrateur.";
            } else if (error.message.includes("identifiants invalides") || error.message.includes("Identifiants invalides")) {
                errorMessage = "Identifiants incorrects. Veuillez vérifier votre nom d'utilisateur et votre mot de passe.";
            } else if (error.message.includes("réseau") || error.message.includes("network")) {
                errorMessage = "Problème de connexion réseau. Veuillez vérifier votre connexion internet et réessayer.";
            } else if (error.message.includes("Réponse invalide du serveur")) {
                errorMessage = "Le serveur d'authentification est inaccessible. Veuillez réessayer ultérieurement ou contacter l'administrateur.";
            }
        }
        
        toast({
            title: "Erreur de connexion",
            description: errorMessage,
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
