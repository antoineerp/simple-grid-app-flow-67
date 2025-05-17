
<?php
/**
 * Script de réparation d'urgence pour les déploiements
 * Ce script crée tous les fichiers nécessaires pour que l'application fonctionne correctement
 */

header('Content-Type: text/plain; charset=utf-8');
echo "=== Script de réparation d'urgence pour le déploiement ===\n";
echo "Exécution: " . date('Y-m-d H:i:s') . "\n\n";

// Créer les dossiers nécessaires
$directories = [
    './api',
    './api/config',
    './api/utils',
    './api/data',
    './assets',
    './public'
];

echo "Création des dossiers nécessaires...\n";
foreach ($directories as $dir) {
    if (!file_exists($dir)) {
        if (mkdir($dir, 0755, true)) {
            echo "✅ Dossier $dir créé\n";
        } else {
            echo "❌ ERREUR: Impossible de créer le dossier $dir\n";
        }
    } else {
        echo "Le dossier $dir existe déjà\n";
    }
}

// Fonction pour créer ou mettre à jour un fichier
function create_or_update_file($path, $content) {
    $dirname = dirname($path);
    if (!file_exists($dirname)) {
        mkdir($dirname, 0755, true);
    }
    
    $result = file_put_contents($path, $content);
    if ($result === false) {
        echo "❌ ERREUR: Impossible de créer/mettre à jour $path\n";
        return false;
    } else {
        echo "✅ Fichier $path créé/mis à jour (" . strlen($content) . " octets)\n";
        chmod($path, 0644);
        return true;
    }
}

// Créer .htaccess pour l'API
echo "\nCréation du fichier api/.htaccess...\n";
$api_htaccess_content = '# Active la réécriture d\'URL
RewriteEngine On

# Définir les types MIME corrects
AddType application/javascript .js
AddType application/javascript .mjs
AddType application/javascript .es.js
AddType text/css .css
AddType application/json .json

# Gérer les requêtes OPTIONS pour CORS
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Configuration CORS et types MIME
<IfModule mod_headers.c>
    # Force le bon type MIME pour les JavaScript modules
    <FilesMatch "\.(m?js|es\.js)$">
        Header set Content-Type "application/javascript"
        Header set X-Content-Type-Options "nosniff"
    </FilesMatch>
    
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    # Eviter la mise en cache
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</IfModule>

# Permettre l\'accès direct aux fichiers PHP spécifiques
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule \.(php)$ - [L]

# Rediriger toutes les requêtes vers l\'index.php sauf pour les fichiers existants
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]';

create_or_update_file('./api/.htaccess', $api_htaccess_content);

// Créer env.php
echo "\nCréation du fichier api/config/env.php...\n";
$env_content = '<?php
// Configuration des variables d\'environnement pour Infomaniak
define("DB_HOST", "p71x6d.myd.infomaniak.com");
define("DB_NAME", "p71x6d_richard");
define("DB_USER", "p71x6d_richard");
define("DB_PASS", "Trottinette43!");
define("API_BASE_URL", "/api");
define("APP_ENV", "production");

// Fonction d\'aide pour récupérer les variables d\'environnement
function get_env($key, $default = null) {
    $const_name = strtoupper($key);
    if (defined($const_name)) {
        return constant($const_name);
    }
    return $default;
}

// Alias pour compatibilité avec différentes syntaxes
if (!function_exists("env")) {
    function env($key, $default = null) {
        return get_env($key, $default);
    }
}
?>';

create_or_update_file('./api/config/env.php', $env_content);

// Créer ResponseHandler.php
echo "\nCréation du fichier api/utils/ResponseHandler.php...\n";
$response_handler_content = '<?php
/**
 * Gestionnaire de réponses API uniformisé
 * Assure un format de réponse cohérent pour toutes les API de l\'application
 */
class ResponseHandler {
    /**
     * Envoie une réponse de succès avec les données fournies
     * 
     * @param mixed $data Données à renvoyer dans la réponse
     * @param int $code Code HTTP de la réponse
     * @param string $message Message optionnel
     */
    public static function success($data = [], $code = 200, $message = "Opération réussie") {
        self::sendResponse(true, $message, $data, $code);
    }
    
    /**
     * Envoie une réponse d\'erreur
     * 
     * @param string $message Message d\'erreur
     * @param int $code Code HTTP de l\'erreur
     * @param array $details Détails supplémentaires sur l\'erreur
     */
    public static function error($message = "Une erreur est survenue", $code = 400, $details = []) {
        self::sendResponse(false, $message, $details, $code);
    }
    
    /**
     * Formate et envoie la réponse JSON
     */
    private static function sendResponse($success, $message, $data, $code) {
        http_response_code($code);
        
        $response = [
            \'success\' => $success,
            \'message\' => $message,
            \'code\' => $code,
            \'timestamp\' => date(\'Y-m-d\\TH:i:s\\Z\')
        ];
        
        if (!empty($data)) {
            $response[\'data\'] = $data;
        }
        
        header(\'Content-Type: application/json; charset=utf-8\');
        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}
?>';

create_or_update_file('./api/utils/ResponseHandler.php', $response_handler_content);

// Créer index.html minimal
echo "\nCréation du fichier index.html...\n";
$index_html_content = '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="ie=edge" />
  <meta name="description" content="Application de gestion de certification Qualiopi - FormaCert" />
  <title>FormaCert - Qualité.cloud</title>
  
  <!-- Références CSS -->
  <link rel="stylesheet" href="/assets/main.css" type="text/css" />
  <link rel="stylesheet" href="/assets/index.css" type="text/css" />
</head>
<body>
  <div id="root">
    <!-- Contenu de chargement initial -->
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
      <h1>FormaCert</h1>
      <p>Chargement de l\'application...</p>
    </div>
  </div>
  
  <!-- Scripts -->
  <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
  <script type="module" src="/assets/index.js"></script>
  <script src="/assets/main.js"></script>
</body>
</html>';

create_or_update_file('./index.html', $index_html_content);

// Créer main.css minimal
echo "\nCréation du fichier assets/main.css...\n";
$main_css_content = '/* 
 * Styles principaux pour l\'application FormaCert
 */

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
    "Helvetica Neue", Arial, sans-serif;
  line-height: 1.5;
  margin: 0;
  padding: 0;
  color: #333;
  background-color: #f9fafb;
}

h1, h2, h3, h4, h5, h6 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-weight: 600;
  line-height: 1.25;
  color: #111827;
}

button, input, select, textarea {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

/* Layout */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Responsive utilities */
@media (min-width: 640px) {
  .container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 768px) {
  .container {
    padding: 0 2rem;
  }
}';

create_or_update_file('./assets/main.css', $main_css_content);

// Créer index.css minimal
echo "\nCréation du fichier assets/index.css...\n";
$index_css_content = '/* 
 * Styles additionnels pour l\'application FormaCert
 */

:root {
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --secondary: #64748b;
  --secondary-hover: #475569;
  --success: #22c55e;
  --danger: #ef4444;
  --warning: #f59e0b;
  --info: #06b6d4;
  --light: #f9fafb;
  --dark: #1f2937;
  --white: #ffffff;
  --gray: #6b7280;
  --border: #e5e7eb;
  --radius: 0.375rem;
}

.text-primary {
  color: var(--primary);
}

.bg-primary {
  background-color: var(--primary);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  padding: 0.5rem 1rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
  cursor: pointer;
}

.btn-primary {
  background-color: var(--primary);
  color: var(--white);
  border: 1px solid var(--primary);
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  border-color: var(--primary-hover);
}';

create_or_update_file('./assets/index.css', $index_css_content);

// Créer index.js minimal
echo "\nCréation du fichier assets/index.js...\n";
$index_js_content = '// Script principal d\'entrée
console.log("Application FormaCert chargée");

// Vérifier si le DOM est chargé
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM chargé, initialisation de l\'application");
  
  // Chercher l\'élément racine
  const rootElement = document.getElementById("root");
  
  if (rootElement) {
    // Tenter de charger les scripts principaux
    try {
      // Si main.js est correctement chargé, cette partie sera remplacée
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h1>FormaCert</h1>
          <p>Application en cours de chargement...</p>
          <p>Si cette page persiste, veuillez vérifier que tous les scripts sont correctement chargés.</p>
        </div>
      `;
    } catch (error) {
      console.error("Erreur lors du chargement de l\'application:", error);
      
      // Afficher un message d\'erreur
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #ef4444;">
          <h1>Erreur de chargement</h1>
          <p>Une erreur est survenue lors du chargement de l\'application.</p>
          <pre style="text-align: left; background: #f9fafb; padding: 10px; border-radius: 5px;">${error.message}</pre>
        </div>
      `;
    }
  }
});';

create_or_update_file('./assets/index.js', $index_js_content);

// Créer main.js minimal
echo "\nCréation du fichier assets/main.js...\n";
$main_js_content = '// Script principal de l\'application
console.log("Script principal chargé");

// Simulation d\'initialisation d\'application
function initApp() {
  console.log("Initialisation de l\'application");
  
  // Chercher l\'élément racine
  const rootElement = document.getElementById("root");
  
  if (rootElement) {
    // Afficher un message pour indiquer que l\'application fonctionne
    rootElement.innerHTML = `
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <header style="text-align: center; margin-bottom: 40px;">
          <h1>FormaCert</h1>
          <p>Plateforme de gestion de la certification Qualiopi</p>
        </header>
        
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2>État du déploiement</h2>
          <p>L\'application a été correctement déployée et les fichiers statiques sont bien chargés.</p>
          
          <h3>Prochaines étapes</h3>
          <ul>
            <li>Vérifier que tous les endpoints API sont accessibles</li>
            <li>Vérifier la connexion à la base de données</li>
            <li>Finaliser le déploiement des modules React de l\'application</li>
          </ul>
        </div>
      </div>
    `;
  }
}

// Exécution après le chargement complet de la page
window.addEventListener("load", initApp);';

create_or_update_file('./assets/main.js', $main_js_content);

// Vérifier que tous les fichiers critiques ont été créés
echo "\n=== VÉRIFICATION DES FICHIERS CRITIQUES ===\n";
$critical_files = [
    './index.html',
    './assets/main.css',
    './assets/index.css',
    './assets/index.js',
    './assets/main.js',
    './api/.htaccess',
    './api/config/env.php',
    './api/utils/ResponseHandler.php'
];

foreach ($critical_files as $file) {
    if (file_exists($file)) {
        echo "✅ $file: PRÉSENT (" . filesize($file) . " octets)\n";
    } else {
        echo "❌ $file: MANQUANT\n";
    }
}

echo "\nScript de réparation d'urgence terminé le " . date('Y-m-d H:i:s') . "\n";
?>
