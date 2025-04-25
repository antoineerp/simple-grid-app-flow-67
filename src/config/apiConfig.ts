
// Configuration de l'API
let apiUrl = '/api';

// Obtenir l'URL de l'API
export function getApiUrl(): string {
    return apiUrl;
}

// Obtenir l'URL complète de l'API
export function getFullApiUrl(): string {
    return `${window.location.protocol}//${window.location.host}${apiUrl}`;
}

// Diagnostic de l'API simple
export async function testApiConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
        const response = await fetch(`${getApiUrl()}/index.php`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
        
        const contentType = response.headers.get('content-type') || '';
        const responseText = await response.text();
        
        try {
            const data = JSON.parse(responseText);
            return {
                success: true,
                message: data.message || 'API connectée',
                details: data
            };
        } catch (e) {
            return {
                success: false,
                message: 'Réponse non-JSON',
                details: {
                    error: e instanceof Error ? e.message : String(e),
                    responseText: responseText.substring(0, 300)
                }
            };
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Erreur inconnue',
            details: { error }
        };
    }
}

// Fonction utilitaire pour les requêtes fetch avec gestion d'erreur
export async function fetchWithErrorHandling(url: string, options?: RequestInit): Promise<any> {
    const response = await fetch(url, options);
    
    if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const text = await response.text();
    if (!text) {
        return {};
    }
    
    return JSON.parse(text);
}
