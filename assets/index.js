
// Point d'entrée dynamique qui charge le fichier JavaScript principal
// Ce fichier est spécialement conçu pour fonctionner sur Infomaniak

// Fonction pour corriger les chemins Infomaniak
function fixInfomaniakPath(path) {
    // Supprimer les chemins doublés comme /sites/domain.com/
    if (path && path.startsWith('/sites/')) {
        const parts = path.split('/', 4);
        if (parts.length >= 4) {
            return '/' + path.split('/', 4).slice(3).join('/');
        }
    }
    return path;
}

// Fonction pour charger dynamiquement le script principal
function loadMainScript() {
    // Détection du fichier principal basé sur un pattern de nommage Vite
    const mainScriptPattern = /main-[a-zA-Z0-9]+\.js$/;
    const scripts = document.querySelectorAll('script[src]');
    let mainScriptFound = false;
    
    console.log("Index.js: Chargement du script principal...");
    console.log("Hostname détecté:", window.location.hostname);
    
    // Chercher d'abord dans les scripts déjà inclus dans la page
    for (const script of scripts) {
        const src = script.getAttribute('src');
        if (src && mainScriptPattern.test(src)) {
            console.log(`Script principal déjà chargé : ${src}`);
            mainScriptFound = true;
            break;
        }
    }
    
    // Si le script principal n'est pas trouvé, charger le fichier main.js directement
    if (!mainScriptFound) {
        try {
            // Pour l'environnement de production
            const mainScript = document.createElement('script');
            mainScript.type = 'module';
            mainScript.src = '/src/main.js';
            document.head.appendChild(mainScript);
            console.log('Chargement de main.js en tant que fallback');
            
            // Ajouter un gestionnaire d'erreurs
            mainScript.onerror = function() {
                console.error("Échec du chargement de main.js, tentative avec main.tsx");
                const tsxScript = document.createElement('script');
                tsxScript.type = 'module';
                tsxScript.src = '/src/main.tsx';
                document.head.appendChild(tsxScript);
                
                // Gestion d'erreur pour le script TSX
                tsxScript.onerror = function() {
                    console.error("Échec du chargement de main.tsx, utilisation du script de diagnostic");
                    loadDiagnosticScript();
                };
            };
        } catch (error) {
            console.error('Erreur lors du chargement du script principal:', error);
            loadDiagnosticScript();
        }
    }
}

// Fonction pour charger le script de diagnostic en dernier recours
function loadDiagnosticScript() {
    console.log("Tentative de chargement du script de diagnostic");
    // Chercher le premier fichier .js dans le dossier assets
    fetchAssetsList()
        .then(files => {
            if (files && files.length > 0) {
                const jsFile = files.find(f => f.endsWith('.js') && f !== 'index.js');
                if (jsFile) {
                    console.log("Chargement du fichier de secours:", jsFile);
                    const script = document.createElement('script');
                    script.type = 'module';
                    script.src = fixInfomaniakPath('/assets/' + jsFile);
                    document.head.appendChild(script);
                }
            }
        })
        .catch(err => {
            console.error("Impossible de récupérer la liste des assets:", err);
            showErrorMessage("Erreur critique: Impossible de charger l'application");
        });
}

// Fonction pour récupérer la liste des fichiers dans le dossier assets
function fetchAssetsList() {
    // Cette fonction simule la récupération des fichiers dans le dossier assets
    // En production, cette liste serait générée par le serveur
    return new Promise(resolve => {
        // Liste par défaut de fichiers potentiels (pour diagnostic)
        resolve([
            'index.js',
            'main-CJp6prML.js', 
            'html2canvas.esm-CBrSDip1.js'
        ]);
    });
}

// Fonction pour afficher un message d'erreur à l'utilisateur
function showErrorMessage(message) {
    const root = document.getElementById('root') || document.body;
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'text-align:center; margin-top:50px; font-family:sans-serif; color:#e74c3c; padding:20px;';
    errorDiv.innerHTML = `
        <h1>Erreur de chargement</h1>
        <p>${message}</p>
        <button onclick="window.location.reload()" style="padding:10px 20px; background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer;">
            Réessayer
        </button>
    `;
    root.appendChild(errorDiv);
}

// Charger le script principal une fois le DOM chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMainScript);
} else {
    loadMainScript();
}
