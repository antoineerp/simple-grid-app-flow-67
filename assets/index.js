
// Point d'entrée dynamique qui charge le fichier JavaScript principal
// Ce fichier est spécialement conçu pour fonctionner sur Infomaniak

// Fonction pour corriger les chemins Infomaniak
function fixInfomaniakPath(path) {
    // Supprimer les chemins doublés comme /sites/domain.com/
    if (path && path.startsWith('/sites/')) {
        const parts = path.split('/');
        if (parts.length >= 4) {
            return '/' + parts.slice(3).join('/');
        }
    }
    return path;
}

// Fonction pour détecter l'environnement Infomaniak
function isInfomaniakEnvironment() {
    // Détection basée sur le nom d'hôte
    const host = window.location.hostname;
    // Multiple detection methods
    return host === 'qualiopi.ch' || 
           host.endsWith('.qualiopi.ch') ||
           host.indexOf('.infomaniak.') > -1 ||
           document.documentElement.innerHTML.indexOf('/sites/') > -1;
}

// Fonction pour charger dynamiquement le script principal
function loadMainScript() {
    console.log("Index.js: Chargement du script principal...");
    console.log("Hostname détecté:", window.location.hostname);
    
    // Forcer la détection Infomaniak par défaut pour qualiopi.ch
    const forceInfomaniak = window.location.hostname === 'qualiopi.ch';
    const isInfomaniak = forceInfomaniak || isInfomaniakEnvironment();
    
    console.log("Environnement Infomaniak détecté?", isInfomaniak ? "OUI" : "NON");
    
    // Corriger tous les chemins d'assets qui pourraient être problématiques
    if (isInfomaniak) {
        console.log("Application des corrections de chemin Infomaniak...");
        document.querySelectorAll('link[href], script[src], img[src]').forEach(el => {
            const attrName = el.hasAttribute('href') ? 'href' : 'src';
            const originalPath = el.getAttribute(attrName);
            const fixedPath = fixInfomaniakPath(originalPath);
            if (originalPath !== fixedPath) {
                console.log(`Correction de chemin: ${originalPath} -> ${fixedPath}`);
                el.setAttribute(attrName, fixedPath);
            }
        });
    }
    
    try {
        // Utiliser une approche plus robuste pour charger les scripts
        const distScript = document.createElement('script');
        distScript.type = 'module';
        
        // Vérifier si nous sommes en environnement de développement ou de production
        if (document.querySelector('script[src*="@vite/client"]')) {
            // Environnement de développement: charger depuis /src/main.tsx
            distScript.src = '/src/main.tsx';
            console.log('Chargement de main.tsx en mode développement');
        } else {
            // Environnement de production: chercher dans les assets compilés
            // Recherche d'un script qui contient "main" dans les assets
            const mainScriptLink = document.querySelector('script[src*="assets/main"]');
            if (mainScriptLink) {
                // Utiliser le script main déjà référencé dans le HTML
                console.log('Script main déjà présent dans le HTML:', mainScriptLink.getAttribute('src'));
                return; // Ne rien faire, le script est déjà chargé
            } else {
                // Chercher d'abord dans /dist/assets/
                distScript.src = '/dist/assets/index.js';
                console.log('Tentative de chargement depuis /dist/assets/index.js');
            }
        }
        
        document.head.appendChild(distScript);
        
        // Ajouter un gestionnaire d'erreurs avec multiples fallbacks
        distScript.onerror = function() {
            console.error("Échec du chargement du script principal:", distScript.src);
            
            // Essayer de charger main.js directement à la racine
            const fallbackScript = document.createElement('script');
            fallbackScript.type = 'module';
            fallbackScript.src = '/src/main.js';
            document.head.appendChild(fallbackScript);
            console.log('Tentative de fallback avec /src/main.js');
            
            // Gestion d'erreur pour le script JS
            fallbackScript.onerror = function() {
                console.error("Échec du chargement des scripts de fallback");
                
                // Dernier recours: essayer de charger depuis assets/
                const lastResortScript = document.createElement('script');
                lastResortScript.type = 'module';
                lastResortScript.src = '/assets/index.js';
                document.head.appendChild(lastResortScript);
                console.log('Dernier recours: chargement depuis /assets/index.js');
                
                lastResortScript.onerror = function() {
                    console.error("Tous les scripts ont échoué, affichage du message d'erreur");
                    showErrorMessage("Erreur critique de chargement des scripts principaux");
                };
            };
        };
    } catch (error) {
        console.error('Erreur lors du chargement du script principal:', error);
        showErrorMessage("Erreur de chargement: " + error.message);
    }
}

// Fonction pour afficher un message d'erreur à l'utilisateur
function showErrorMessage(message) {
    const root = document.getElementById('root') || document.body;
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'text-align:center; margin-top:50px; font-family:sans-serif; color:#e74c3c; padding:20px;';
    errorDiv.innerHTML = `
        <h1>Erreur de chargement</h1>
        <p>${message}</p>
        <p>Veuillez réessayer ou contacter le support technique si le problème persiste.</p>
        <button onclick="window.location.reload()" style="padding:10px 20px; background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer; margin-top:15px;">
            Réessayer
        </button>
    `;
    root.innerHTML = '';
    root.appendChild(errorDiv);
}

// Charger le script principal une fois le DOM chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMainScript);
} else {
    loadMainScript();
}

// Ajouter un gestionnaire d'erreurs global
window.addEventListener('error', function(event) {
    console.error('Erreur globale détectée:', event.error);
    // Ne pas afficher automatiquement l'erreur pour éviter les cycles
});

