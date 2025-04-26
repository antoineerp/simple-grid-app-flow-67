
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
    console.log("Index.js: Chargement du script principal...");
    console.log("Hostname détecté:", window.location.hostname);
    
    try {
        // Pour l'environnement de production
        const mainScript = document.createElement('script');
        mainScript.type = 'module';
        mainScript.src = '/src/main.tsx';
        document.head.appendChild(mainScript);
        console.log('Chargement de main.tsx');
        
        // Ajouter un gestionnaire d'erreurs
        mainScript.onerror = function() {
            console.error("Échec du chargement de main.tsx, tentative avec main.js");
            const jsScript = document.createElement('script');
            jsScript.type = 'module';
            jsScript.src = '/src/main.js';
            document.head.appendChild(jsScript);
            
            // Gestion d'erreur pour le script JS
            jsScript.onerror = function() {
                console.error("Échec du chargement de main.js, utilisation du script de diagnostic");
                showErrorMessage("Erreur de chargement des scripts principaux");
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
