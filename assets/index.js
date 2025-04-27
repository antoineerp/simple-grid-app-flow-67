
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

// Fonction pour injecter un script dans la page
function injectScript(src, type = 'module', async = true) {
    console.log(`Injection de script: ${src}`);
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.type = type;
        script.async = async;
        
        script.onload = () => {
            console.log(`Script chargé avec succès: ${src}`);
            resolve(script);
        };
        
        script.onerror = (error) => {
            console.error(`Erreur de chargement de script: ${src}`, error);
            reject(error);
        };
        
        document.head.appendChild(script);
    });
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
        // Vérifier si un script main est déjà présent
        const mainScript = document.querySelector('script[src*="main"]');
        if (mainScript) {
            console.log('Script main déjà présent dans le HTML:', mainScript.getAttribute('src'));
            // Même si le script est présent, nous allons vérifier s'il a été exécuté
            setTimeout(() => {
                if (!window.ReactDOMRoot) {
                    console.log("Le script main n'a pas correctement initialisé React, tentative de chargement direct");
                    loadFallbackScript();
                }
            }, 1000); // Attendre 1 seconde pour voir si React s'initialise
            return;
        }
        
        // Stratégie de chargement par priorité
        loadOptimalScript();
        
    } catch (error) {
        console.error('Erreur lors du chargement du script principal:', error);
        loadFallbackScript();
    }
}

// Fonction pour charger le script optimal selon l'environnement
async function loadOptimalScript() {
    try {
        // Essayer d'abord le script compilé dans dist/assets
        if (await tryLoadScript('/dist/assets/main.js')) return;
        
        // Ensuite, essayer le script dans assets
        if (await tryLoadScript('/assets/main.js')) return;
        
        // Ensuite, essayer le script principal dans src
        if (await tryLoadScript('/src/main.js')) return;
        
        // Essayer ensuite le script TSX
        if (await tryLoadScript('/src/main.tsx')) return;
        
        // Si tout échoue, charger le script fallback
        loadFallbackScript();
    } catch (error) {
        console.error("Erreur lors du chargement des scripts:", error);
        loadFallbackScript();
    }
}

// Essayer de charger un script et retourner true si réussi
async function tryLoadScript(src) {
    try {
        console.log(`Tentative de chargement depuis ${src}`);
        await injectScript(src);
        console.log(`Chargement réussi depuis ${src}`);
        return true;
    } catch (error) {
        console.log(`Échec du chargement depuis ${src}:`, error);
        return false;
    }
}

// Fonction pour charger le script fallback directement intégré
function loadFallbackScript() {
    console.log("Chargement du script fallback intégré...");
    
    // Charger React et ReactDOM directement via CDN si nécessaire
    const reactLoaded = document.querySelector('script[src*="react"]');
    if (!reactLoaded) {
        const reactScript = document.createElement('script');
        reactScript.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
        reactScript.crossOrigin = 'anonymous';
        document.head.appendChild(reactScript);
        
        const reactDomScript = document.createElement('script');
        reactDomScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
        reactDomScript.crossOrigin = 'anonymous';
        document.head.appendChild(reactDomScript);
    }
    
    // Injecter notre propre script de démarrage
    const inlineScript = document.createElement('script');
    inlineScript.innerHTML = `
        document.addEventListener('DOMContentLoaded', function() {
            try {
                const rootElement = document.getElementById('root');
                if (!rootElement) {
                    const newRoot = document.createElement('div');
                    newRoot.id = 'root';
                    document.body.appendChild(newRoot);
                    console.log("Élément racine créé manuellement");
                }
                
                // Vérifier si la page est complètement blanche
                if (document.body.children.length <= 1) {
                    document.body.innerHTML = '<div id="root"></div>';
                    console.log("Page entièrement réinitialisée");
                }
                
                console.log("Script fallback exécuté");
            } catch (err) {
                console.error("Erreur dans le script fallback:", err);
                document.body.innerHTML = '<div style="text-align:center; padding:30px; font-family:sans-serif;"><h1>Erreur de chargement</h1><p>Impossible de charger l\'application.</p><button onclick="window.location.reload()">Réessayer</button></div>';
            }
        });
    `;
    document.head.appendChild(inlineScript);
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

// Détecter les problèmes de chargement tardifs
window.addEventListener('load', function() {
    setTimeout(() => {
        const rootElement = document.getElementById('root');
        // Si la page semble vide ou l'élément root est vide
        if (!rootElement || rootElement.children.length === 0) {
            console.warn("Page possiblement blanche détectée après chargement complet, tentative de récupération...");
            loadFallbackScript();
        }
    }, 2000); // Vérifier 2 secondes après le chargement complet
});
