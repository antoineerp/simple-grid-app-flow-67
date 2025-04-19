
<?php
// Fichier de configuration d'environnement

// Déterminer l'environnement en fonction du nom d'hôte
$currentHost = $_SERVER['HTTP_HOST'] ?? '';

// Définir l'environnement par défaut
$environment = 'production'; // Environnement par défaut pour Infomaniak

// Journaliser l'hôte détecté (pour débogage)
error_log("Détection d'environnement sur hôte: " . $currentHost);

// Détecter l'environnement en fonction du nom d'hôte
if (strpos($currentHost, 'localhost') !== false || strpos($currentHost, '127.0.0.1') !== false) {
    $environment = 'development';
} else if (strpos($currentHost, 'qualiopi.ch') !== false) {
    $environment = 'production';
    error_log("Détection d'environnement: Production sur qualiopi.ch");
}

// Définir les variables d'environnement
$_ENV['APP_ENV'] = $environment;

// Configuration API
$_ENV['API_URL_DEV'] = 'http://localhost:8080/api';
$_ENV['API_URL_PROD'] = 'https://qualiopi.ch/api'; // URL sans www

// Configuration CORS
$_ENV['ALLOWED_ORIGIN_DEV'] = 'http://localhost:8080';
$_ENV['ALLOWED_ORIGIN_PROD'] = 'https://qualiopi.ch'; // URL sans www

// Journaliser l'environnement détecté en production (pour le débogage initial)
if ($environment === 'production') {
    error_log("Application démarrée en environnement de PRODUCTION sur l'hôte: " . $currentHost);
    error_log("API URL: " . $_ENV['API_URL_PROD']);
    error_log("ALLOWED ORIGIN: " . $_ENV['ALLOWED_ORIGIN_PROD']);
    
    // Journaliser les informations sur les demandes de ressources statiques
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (strpos($uri, '.js') !== false || 
        strpos($uri, '.css') !== false || 
        strpos($uri, '/assets/') !== false) {
        
        error_log("[Asset diagnostics] Requête d'asset détectée: " . $uri);
        error_log("[Asset diagnostics] Document root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'non défini'));
        error_log("[Asset diagnostics] Fichier physique: " . ($_SERVER['SCRIPT_FILENAME'] ?? 'non défini'));
        error_log("[Asset diagnostics] Accept: " . ($_SERVER['HTTP_ACCEPT'] ?? 'non défini'));
        error_log("[Asset diagnostics] User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'non défini'));
        
        // Vérifiez si le fichier existe
        $file_path = $_SERVER['DOCUMENT_ROOT'] . $uri;
        if (file_exists($file_path)) {
            error_log("[Asset diagnostics] Le fichier existe sur le disque: " . $file_path);
            error_log("[Asset diagnostics] Taille du fichier: " . filesize($file_path) . " octets");
        } else {
            error_log("[Asset diagnostics] Le fichier N'EXISTE PAS sur le disque: " . $file_path);
            
            // Recherche de fichiers similaires
            $directory = dirname($file_path);
            if (is_dir($directory)) {
                $files = scandir($directory);
                error_log("[Asset diagnostics] Fichiers dans le même dossier: " . implode(", ", $files));
            } else {
                error_log("[Asset diagnostics] Le dossier n'existe pas: " . $directory);
            }
        }
    }
}

// Configuration de l'encodage
ini_set('default_charset', 'UTF-8');
mb_internal_encoding('UTF-8');

// Ajout d'une configuration spécifique pour Infomaniak
if ($environment === 'production') {
    // Désactiver l'affichage des erreurs en production
    ini_set('display_errors', 0);
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    
    // Journaliser les erreurs dans le fichier de log
    ini_set('log_errors', 1);
    ini_set('error_log', '/tmp/php-errors.log'); // Chemin typique pour Infomaniak
} else {
    // Activer l'affichage des erreurs en développement
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
}

// Fonction pour nettoyer et convertir en UTF-8
function cleanUTF8($input) {
    return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
}

// Fonction d'aide pour obtenir une variable d'environnement
function env($key, $default = null) {
    return $_ENV[$key] ?? $default;
}

// Définir la fonction getenv personnalisée pour assurer la compatibilité
if (!function_exists('getenv_custom')) {
    function getenv_custom($key, $default = null) {
        return $_ENV[$key] ?? $default;
    }
}
?>
