
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

// Test progressif de l'API en plusieurs étapes pour identifier précisément les problèmes
export async function testApiConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
        // Étape 1: Tester que le serveur HTTP répond correctement
        console.log("Test de connexion HTTP de base...");
        const httpTestUrl = `${apiUrl}/http-test.php`;
        
        try {
            const httpResponse = await fetch(httpTestUrl, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
            
            // Si nous obtenons une réponse, essayons de la parser
            const httpText = await httpResponse.text();
            
            try {
                // Essayer de parser en JSON
                const httpJson = JSON.parse(httpText);
                console.log("Test HTTP réussi:", httpJson);
                
                // Succès! Maintenant testons le chemin des fichiers
                console.log("Test des chemins de fichiers...");
                const pathsTestUrl = `${apiUrl}/diagnose-paths.php`;
                
                try {
                    const pathsResponse = await fetch(pathsTestUrl, {
                        method: 'GET',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate'
                        }
                    });
                    
                    const pathsText = await pathsResponse.text();
                    
                    try {
                        // Tenter de parser en JSON
                        const pathsJson = JSON.parse(pathsText);
                        console.log("Test des chemins réussi:", pathsJson);
                        
                        // Si tout va bien jusqu'ici, testons la base de données
                        console.log("Test de connexion à la base de données...");
                        const dbTestUrl = `${apiUrl}/db-connection-simple.php`;
                        
                        try {
                            const dbResponse = await fetch(dbTestUrl, {
                                method: 'GET',
                                headers: {
                                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                                }
                            });
                            
                            const dbText = await dbResponse.text();
                            
                            try {
                                // Tenter de parser en JSON
                                const dbJson = JSON.parse(dbText);
                                console.log("Test de base de données réussi:", dbJson);
                                
                                // Tout est OK!
                                return {
                                    success: true,
                                    message: 'API et base de données connectées avec succès',
                                    details: dbJson
                                };
                            } catch (dbParseError) {
                                // Problème avec le test de base de données
                                return {
                                    success: false,
                                    message: 'Erreur lors du test de base de données: réponse non-JSON',
                                    details: {
                                        error: dbParseError instanceof Error ? dbParseError.message : String(dbParseError),
                                        response: dbText.substring(0, 500),
                                        stage: 'database'
                                    }
                                };
                            }
                        } catch (dbError) {
                            // Problème avec la requête de base de données
                            return {
                                success: false,
                                message: 'Erreur lors de la connexion au test de base de données',
                                details: {
                                    error: dbError instanceof Error ? dbError.message : String(dbError),
                                    stage: 'database_request'
                                }
                            };
                        }
                    } catch (pathsParseError) {
                        // Problème avec le test de chemins
                        return {
                            success: false,
                            message: 'Erreur lors du test de chemins: réponse non-JSON',
                            details: {
                                error: pathsParseError instanceof Error ? pathsParseError.message : String(pathsParseError),
                                response: pathsText.substring(0, 500),
                                stage: 'paths'
                            }
                        };
                    }
                } catch (pathsError) {
                    // Problème avec la requête de chemins
                    return {
                        success: false,
                        message: 'Erreur lors de la connexion au test de chemins',
                        details: {
                            error: pathsError instanceof Error ? pathsError.message : String(pathsError),
                            stage: 'paths_request'
                        }
                    };
                }
            } catch (httpParseError) {
                // Problème avec le premier test HTTP
                return {
                    success: false,
                    message: 'Erreur lors du test HTTP de base: réponse non-JSON',
                    details: {
                        error: httpParseError instanceof Error ? httpParseError.message : String(httpParseError),
                        response: httpText.substring(0, 500),
                        stage: 'http',
                        tip: 'Ce problème indique généralement que PHP n\'est pas correctement exécuté sur le serveur'
                    }
                };
            }
        } catch (httpError) {
            // Problème avec la connexion HTTP de base
            return {
                success: false,
                message: 'Erreur lors de la connexion HTTP de base',
                details: {
                    error: httpError instanceof Error ? httpError.message : String(httpError),
                    stage: 'http_request',
                    tip: 'Vérifiez que votre serveur est accessible et que les routes sont correctes'
                }
            };
        }
    } catch (error) {
        // Erreur générale
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Erreur inconnue',
            details: { error }
        };
    }
}

// Fonction utilitaire pour les requêtes fetch avec gestion d'erreur
export async function fetchWithErrorHandling(url: string, options?: RequestInit): Promise<any> {
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const text = await response.text();
        if (!text) {
            return {};
        }
        
        return JSON.parse(text);
    } catch (error) {
        console.error("Erreur fetchWithErrorHandling:", error);
        throw error;
    }
}
