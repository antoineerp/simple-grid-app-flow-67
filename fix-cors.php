
<?php
// Script pour corriger la configuration CORS
header('Content-Type: text/html; charset=utf-8');

$changes = [];

// 1. Mise à jour du fichier api/.htaccess
$api_htaccess_path = 'api/.htaccess';
if (file_exists($api_htaccess_path)) {
    $api_htaccess_content = <<<EOT
# Configuration pour le dossier API sur Infomaniak

# Configuration PHP correcte (sans conflits)
AddHandler application/x-httpd-php .php
AddType application/x-httpd-php .php
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Activer la réécriture d'URL
RewriteEngine On

# Définir les types MIME corrects
AddType application/javascript .js
AddType application/json .json
AddType text/css .css

# Gérer les requêtes OPTIONS pour CORS
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Configuration CORS et types MIME
<IfModule mod_headers.c>
    # Force le bon type MIME pour les JavaScript
    <FilesMatch "\.js$">
        Header set Content-Type "application/javascript"
        Header set X-Content-Type-Options "nosniff"
    </FilesMatch>
    
    # Configuration CORS standardisée
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-Device-ID"
    Header always set Access-Control-Max-Age "3600"
    
    # Éviter la mise en cache des réponses API
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</IfModule>

# Permettre l'accès direct aux fichiers PHP spécifiques
<FilesMatch "^(phpinfo|db-test|check|phpinfo-test|diagnostic|testdb|test|cors-diagnostic)\.php$">
    # Aucune réécriture pour ces fichiers
</FilesMatch>

# Rediriger toutes les requêtes vers l'index.php sauf pour les fichiers existants
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
EOT;

    if (file_put_contents($api_htaccess_path, $api_htaccess_content)) {
        $changes[] = "$api_htaccess_path mis à jour avec la nouvelle configuration CORS";
    } else {
        $changes[] = "ERREUR: Impossible de mettre à jour $api_htaccess_path";
    }
} else {
    $changes[] = "ERREUR: Le fichier $api_htaccess_path n'existe pas";
}

// 2. Création du fichier CorsHelper.php s'il n'existe pas
$cors_helper_path = 'api/utils/CorsHelper.php';
if (!file_exists(dirname($cors_helper_path))) {
    mkdir(dirname($cors_helper_path), 0755, true);
}

$cors_helper_content = <<<EOT
<?php
/**
 * Classe utilitaire pour la standardisation des en-têtes CORS
 */
class CorsHelper {
    /**
     * Configure les en-têtes CORS standard pour toutes les requêtes API
     * 
     * @param string \$allowedOrigin Origine autorisée (par défaut "*" pour toutes)
     * @param string \$allowedMethods Méthodes HTTP autorisées
     */
    public static function configureCors(\$allowedOrigin = "*", \$allowedMethods = "GET, POST, PUT, DELETE, OPTIONS") {
        // Nettoyer tout buffer de sortie existant pour éviter les problèmes d'en-têtes
        if (ob_get_level()) ob_clean();
        
        // Définir l'origine autorisée (peut être dynamique)
        header("Access-Control-Allow-Origin: \$allowedOrigin");
        
        // Méthodes et en-têtes autorisés
        header("Access-Control-Allow-Methods: \$allowedMethods");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Device-ID");
        
        // Durée de mise en cache des requêtes preflight
        header("Access-Control-Max-Age: 3600");
        
        // Autoriser l'envoi de cookies
        header("Access-Control-Allow-Credentials: true");
        
        // Anti-cache pour les réponses API
        header("Cache-Control: no-cache, no-store, must-revalidate");
        header("Pragma: no-cache");
        header("Expires: 0");
    }
    
    /**
     * Gérer les requêtes OPTIONS (preflight)
     * 
     * @param bool \$exitAfter Si true, termine l'exécution après avoir géré la requête OPTIONS
     */
    public static function handlePreflight(\$exitAfter = true) {
        if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            if (\$exitAfter) exit;
        }
    }
    
    /**
     * Configurer les en-têtes CORS et traiter les requêtes OPTIONS en une seule méthode
     * 
     * @param string \$allowedOrigin Origine autorisée
     * @param string \$allowedMethods Méthodes HTTP autorisées
     * @param string \$contentType Type de contenu (par défaut application/json)
     */
    public static function setupCors(\$allowedOrigin = "*", \$allowedMethods = "GET, POST, PUT, DELETE, OPTIONS", \$contentType = "application/json") {
        // Définir le type de contenu
        header("Content-Type: \$contentType; charset=UTF-8");
        
        // Configurer les en-têtes CORS
        self::configureCors(\$allowedOrigin, \$allowedMethods);
        
        // Traiter les requêtes OPTIONS
        self::handlePreflight();
    }
    
    /**
     * Vérifier si l'origine est autorisée et renvoyer l'en-tête approprié
     * 
     * @param array \$allowedOrigins Liste des origines autorisées
     * @return string L'origine autorisée utilisée
     */
    public static function getAllowedOrigin(\$allowedOrigins = ['http://localhost:8080', 'https://qualiopi.ch']) {
        \$origin = isset(\$_SERVER['HTTP_ORIGIN']) ? \$_SERVER['HTTP_ORIGIN'] : '';
        
        if (in_array(\$origin, \$allowedOrigins)) {
            return \$origin;
        }
        
        // Origine par défaut si aucune correspondance
        return '*';
    }
}
?>
EOT;

if (file_put_contents($cors_helper_path, $cors_helper_content)) {
    $changes[] = "$cors_helper_path créé avec succès";
} else {
    $changes[] = "ERREUR: Impossible de créer $cors_helper_path";
}

// 3. Création du script de diagnostic CORS
$cors_diagnostic_path = 'api/cors-diagnostic.php';
$cors_diagnostic_content = <<<EOT
<?php
// Script de diagnostic CORS
require_once 'utils/CorsHelper.php';

// Configurer les en-têtes CORS pour ce test
CorsHelper::setupCors("*", "GET, POST, OPTIONS", "application/json");

// Récupérer tous les en-têtes de requête
\$requestHeaders = getallheaders();

// Créer la réponse
\$response = [
    'status' => 'success',
    'message' => 'Diagnostic CORS',
    'request' => [
        'method' => \$_SERVER['REQUEST_METHOD'],
        'origin' => \$_SERVER['HTTP_ORIGIN'] ?? 'Non définie',
        'headers' => \$requestHeaders
    ],
    'server' => [
        'software' => \$_SERVER['SERVER_SOFTWARE'],
        'php_version' => phpversion(),
        'protocol' => \$_SERVER['SERVER_PROTOCOL']
    ],
    'cors' => [
        'allowed_origin' => '*',
        'allowed_methods' => 'GET, POST, OPTIONS, PUT, DELETE',
        'allowed_headers' => 'Content-Type, Authorization, X-Requested-With, X-Device-ID'
    ],
    'apache_modules' => function_exists('apache_get_modules') ? 
                          array_filter(apache_get_modules(), function(\$module) {
                              return strpos(\$module, 'headers') !== false || strpos(\$module, 'rewrite') !== false;
                          }) : 
                          'Non disponible'
];

// Vérifier la configuration .htaccess
\$htaccessPath = __DIR__ . '/.htaccess';
\$response['htaccess'] = [
    'exists' => file_exists(\$htaccessPath),
    'readable' => is_readable(\$htaccessPath),
    'cors_config' => file_exists(\$htaccessPath) ? 
                    (strpos(file_get_contents(\$htaccessPath), 'Access-Control-Allow') !== false) : 
                    false
];

// Vérifier si une requête spécifique est testée
\$testUrl = isset(\$_GET['testUrl']) ? \$_GET['testUrl'] : null;

if (\$testUrl) {
    // Tester une requête CORS vers l'URL spécifiée
    \$ch = curl_init(\$testUrl);
    curl_setopt(\$ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt(\$ch, CURLOPT_HEADER, true);
    curl_setopt(\$ch, CURLOPT_NOBODY, true);
    curl_setopt(\$ch, CURLOPT_HTTPHEADER, ['Origin: https://qualiopi.ch']);
    
    \$result = curl_exec(\$ch);
    \$httpCode = curl_getinfo(\$ch, CURLINFO_HTTP_CODE);
    curl_close(\$ch);
    
    \$response['test_request'] = [
        'url' => \$testUrl,
        'status_code' => \$httpCode,
        'headers' => \$result ? explode("\n", \$result) : 'Erreur lors de la requête'
    ];
}

// Renvoyer la réponse
echo json_encode(\$response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
EOT;

if (file_put_contents($cors_diagnostic_path, $cors_diagnostic_content)) {
    $changes[] = "$cors_diagnostic_path créé avec succès";
} else {
    $changes[] = "ERREUR: Impossible de créer $cors_diagnostic_path";
}

// Créer une page HTML de rapport
echo '<!DOCTYPE html>
<html>
<head>
    <title>Correction des paramètres CORS</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .success { color: green; }
        .error { color: red; }
        .box { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .next-steps { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; }
    </style>
</head>
<body>
    <h1>Correction des paramètres CORS</h1>
    
    <div class="box">
        <h2>Modifications effectuées:</h2>
        <ul>';

foreach ($changes as $change) {
    if (strpos($change, 'ERREUR') !== false) {
        echo '<li class="error">' . htmlspecialchars($change) . '</li>';
    } else {
        echo '<li class="success">' . htmlspecialchars($change) . '</li>';
    }
}

echo '</ul>
    </div>
    
    <div class="next-steps">
        <h2>Prochaines étapes:</h2>
        <ol>
            <li>Accédez à <a href="cors-test.html" target="_blank">l\'outil de test CORS</a> pour vérifier si les problèmes sont résolus.</li>
            <li>Vérifiez le diagnostic CORS en accédant à <a href="api/cors-diagnostic.php" target="_blank">api/cors-diagnostic.php</a></li>
            <li>Si les problèmes persistent, assurez-vous que le module <code>mod_headers</code> d\'Apache est activé.</li>
        </ol>
    </div>
</body>
</html>';
?>
