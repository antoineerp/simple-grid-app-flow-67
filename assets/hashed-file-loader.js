
/**
 * Script de chargement automatique des fichiers hachés
 * Ce script détecte et charge les fichiers JS et CSS principaux avec hachage
 */

(function() {
    console.log('Détection des fichiers hachés...');
    
    // Fonction pour trouver le fichier JavaScript principal haché
    function findMainHashedScript() {
        const scripts = document.querySelectorAll('script[src]');
        for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].getAttribute('src');
            if (src && (src.includes('main.') || src.includes('index.')) && 
                /\.[A-Za-z0-9]{8,}\.js$/.test(src)) {
                return src;
            }
        }
        return null;
    }
    
    // Fonction pour charger un script dynamiquement
    function loadScript(src, isModule = true) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            if (isModule) {
                script.type = 'module';
            }
            script.onload = () => {
                console.log(`Script chargé avec succès: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`Erreur lors du chargement du script: ${src}`);
                reject(new Error(`Échec du chargement de ${src}`));
            };
            document.body.appendChild(script);
        });
    }
    
    // Fonction pour charger une feuille de style dynamiquement
    function loadStylesheet(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => {
                console.log(`Feuille de style chargée avec succès: ${href}`);
                resolve();
            };
            link.onerror = () => {
                console.error(`Erreur lors du chargement de la feuille de style: ${href}`);
                reject(new Error(`Échec du chargement de ${href}`));
            };
            document.head.appendChild(link);
        });
    }
    
    // Fonction pour scanner le dossier assets et trouver les fichiers hachés
    async function scanForHashedFiles() {
        try {
            // Cette approche nécessite un endpoint côté serveur qui fournit la liste des fichiers
            // Pour cette démonstration, nous utilisons un événement personnalisé
            document.dispatchEvent(new CustomEvent('checkHashedFiles'));
            
            // Vérifier si le fichier principal est déjà chargé
            const mainScript = findMainHashedScript();
            if (mainScript) {
                console.log('Script principal haché déjà chargé:', mainScript);
            } else {
                console.log('Aucun script principal haché détecté dans le DOM');
            }
        } catch (error) {
            console.error('Erreur lors du scan des fichiers hachés:', error);
        }
    }
    
    // Lancer la détection
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scanForHashedFiles);
    } else {
        scanForHashedFiles();
    }
    
    // Exposer les fonctions pour utilisation externe
    window.hashedFileLoader = {
        loadScript,
        loadStylesheet,
        scanForHashedFiles
    };
})();
