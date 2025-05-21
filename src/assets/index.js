
// Fichier pont pour la compatibilité avec les scripts de diagnostic
console.log("Chargement de l'application Qualite.cloud...");

// Fonction pour détecter le fichier main.js actuel
function detectMainScript() {
    const scripts = document.querySelectorAll('script[src*="main-"]');
    if (scripts.length > 0) {
        console.log("Script principal détecté:", scripts[0].getAttribute('src'));
        return true;
    }
    return false;
}

// Fonction pour charger dynamiquement un script
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.type = 'module';
        script.onload = () => {
            console.log(`Script chargé avec succès: ${src}`);
            resolve();
        };
        script.onerror = (error) => {
            console.error(`Erreur de chargement du script: ${src}`, error);
            reject(error);
        };
        document.head.appendChild(script);
    });
}

// Fonction pour afficher un message d'erreur visible
function showErrorMessage(message) {
    const errorMessage = document.createElement('div');
    errorMessage.style = `
        position: fixed;
        top: 10px;
        left: 10px;
        background-color: #f8d7da;
        color: #721c24;
        padding: 10px;
        border-radius: 4px;
        z-index: 9999;
        max-width: 80%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    errorMessage.innerHTML = `
        <strong>Erreur de chargement</strong>
        <p>${message}</p>
        <button onclick="window.location.reload()" style="background: #721c24; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Rafraîchir</button>
    `;
    document.body.appendChild(errorMessage);
}

// Essayer de détecter et charger le bon script
try {
    if (!detectMainScript()) {
        console.log("Script principal non trouvé, tentative de chargement dynamique");
        
        // Essayer de charger main.js ou tout autre script avec un hash dans le nom
        const scriptPaths = [
            '/src/main.tsx',
            '/src/main.js',
            '/assets/main.js',
            './main.js'
        ];
        
        let loaded = false;
        
        // Essayer chaque chemin un par un
        Promise.any(scriptPaths.map(path => {
            return loadScript(path)
                .then(() => {
                    loaded = true;
                    console.log(`Application chargée avec succès via ${path}`);
                })
                .catch(err => {
                    console.warn(`Échec du chargement via ${path}:`, err);
                    throw err; // Propager l'erreur pour que Promise.any continue
                });
        }))
        .catch(error => {
            console.error("Tous les scripts ont échoué à charger", error);
            
            // Si aucun script n'a pu être chargé, afficher une erreur et essayer de charger directement depuis src/
            if (!loaded) {
                showErrorMessage("L'application n'a pas pu être chargée correctement. Vérifiez la console pour plus de détails.");
                
                // Tentative de dernier recours - charger directement depuis src
                import('/src/main.tsx')
                    .then(() => console.log("Application chargée directement depuis src/main.tsx"))
                    .catch(e => console.error("Échec du chargement direct depuis src/main.tsx:", e));
            }
        });
    }
} catch (e) {
    console.error("Erreur lors du chargement de l'application", e);
    showErrorMessage(`Erreur lors du chargement de l'application: ${e.message || 'Erreur inconnue'}`);
}
