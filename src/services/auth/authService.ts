
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

    // Mode simplifié - simule la connexion sans appel API
    public async login(username: string, password: string): Promise<any> {
        try {
            console.log(`Tentative de connexion pour l'utilisateur: ${username}`);
            
            // Liste des utilisateurs de test
            const testUsers = {
                'admin': { password: 'admin123', role: 'admin' },
                'p71x6d_system': { password: 'Trottinette43!', role: 'admin' },
                'antcirier@gmail.com': { password: 'password123', role: 'admin' },
                'p71x6d_dupont': { password: 'manager456', role: 'gestionnaire' },
                'p71x6d_martin': { password: 'user789', role: 'utilisateur' }
            };
            
            // Vérifier les identifiants
            if (testUsers[username] && testUsers[username].password === password) {
                // Simuler un token JWT
                const token = btoa(JSON.stringify({
                    user: username,
                    role: testUsers[username].role,
                    exp: Date.now() + 3600000
                }));
                
                this.setToken(token);
                
                const user = {
                    identifiant_technique: username,
                    role: testUsers[username].role,
                    nom: username.includes('@') ? username.split('@')[0] : username,
                    prenom: '',
                    email: username.includes('@') ? username : `${username}@example.com`
                };
                
                localStorage.setItem('currentUser', user.identifiant_technique);
                localStorage.setItem('userRole', user.role);
                localStorage.setItem('userName', `${user.prenom} ${user.nom}`);
                
                await initializeUserData(user.identifiant_technique);
                
                return {
                    success: true,
                    user: user
                };
            } else {
                throw new Error('Identifiants invalides');
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
