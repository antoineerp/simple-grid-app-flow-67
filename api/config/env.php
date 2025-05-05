
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

// Configuration des chemins pour Infomaniak
$_ENV['INFOMANIAK_SITE_ROOT'] = '/sites/qualiopi.ch';
$_ENV['INFOMANIAK_DOMAIN_ROOT'] = '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch';
$_ENV['INFOMANIAK_TEST_DOMAIN_ROOT'] = '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/test.qualiopi.ch';

// Détection des chemins Infomaniak
$documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
$_ENV['IS_INFOMANIAK'] = (strpos($documentRoot, '/sites/') !== false) ? 'true' : 'false';

// Journaliser l'environnement détecté en production (pour le débogage initial)
if ($environment === 'production') {
    error_log("Application démarrée en environnement de PRODUCTION sur l'hôte: " . $currentHost);
    error_log("API URL: " . $_ENV['API_URL_PROD']);
    error_log("ALLOWED ORIGIN: " . $_ENV['ALLOWED_ORIGIN_PROD']);
    error_log("DOCUMENT_ROOT: " . $documentRoot);
    error_log("IS_INFOMANIAK: " . $_ENV['IS_INFOMANIAK']);
    
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
        $infomaniak_path = $_SERVER['DOCUMENT_ROOT'] . '/sites/qualiopi.ch' . $uri;
        
        error_log("[Asset diagnostics] Tentative de chemin standard: " . $file_path);
        error_log("[Asset diagnostics] Tentative de chemin Infomaniak: " . $infomaniak_path);
        
        if (file_exists($file_path)) {
            error_log("[Asset diagnostics] Le fichier existe sur le disque: " . $file_path);
            error_log("[Asset diagnostics] Taille du fichier: " . filesize($file_path) . " octets");
        } else if (file_exists($infomaniak_path)) {
            error_log("[Asset diagnostics] Le fichier existe sur le chemin Infomaniak: " . $infomaniak_path);
            error_log("[Asset diagnostics] Taille du fichier: " . filesize($infomaniak_path) . " octets");
        } else {
            error_log("[Asset diagnostics] Le fichier N'EXISTE PAS sur le disque: " . $file_path);
            error_log("[Asset diagnostics] Le fichier N'EXISTE PAS sur le chemin Infomaniak: " . $infomaniak_path);
            
            // Recherche de fichiers similaires
            $directory = dirname($file_path);
            if (is_dir($directory)) {
                $files = scandir($directory);
                error_log("[Asset diagnostics] Fichiers dans le même dossier: " . implode(", ", $files));
            } else {
                error_log("[Asset diagnostics] Le dossier n'existe pas: " . $directory);
                
                // Essayer avec le chemin Infomaniak
                $infomaniak_directory = dirname($infomaniak_path);
                if (is_dir($infomaniak_directory)) {
                    $files = scandir($infomaniak_directory);
                    error_log("[Asset diagnostics] Fichiers dans le dossier Infomaniak: " . implode(", ", $files));
                } else {
                    error_log("[Asset diagnostics] Le dossier Infomaniak n'existe pas: " . $infomaniak_directory);
                }
            }
        }
    }
}

// Charger la configuration depuis le fichier app_config.json s'il existe
$configFile = __DIR__ . '/app_config.json';
if (file_exists($configFile)) {
    $configData = json_decode(file_get_contents($configFile), true);
    
    if (isset($configData['api_urls'])) {
        if (isset($configData['api_urls']['development'])) {
            $_ENV['API_URL_DEV'] = $configData['api_urls']['development'];
        }
        if (isset($configData['api_urls']['production'])) {
            $_ENV['API_URL_PROD'] = $configData['api_urls']['production'];
        }
    }
    
    if (isset($configData['allowed_origins'])) {
        if (isset($configData['allowed_origins']['development'])) {
            $_ENV['ALLOWED_ORIGIN_DEV'] = $configData['allowed_origins']['development'];
        }
        if (isset($configData['allowed_origins']['production'])) {
            $_ENV['ALLOWED_ORIGIN_PROD'] = $configData['allowed_origins']['production'];
        }
    }
    
    // Charger les chemins personnalisés si configurés
    if (isset($configData['infomaniak_paths'])) {
        if (isset($configData['infomaniak_paths']['site_root'])) {
            $_ENV['INFOMANIAK_SITE_ROOT'] = $configData['infomaniak_paths']['site_root'];
        }
        if (isset($configData['infomaniak_paths']['domain_root'])) {
            $_ENV['INFOMANIAK_DOMAIN_ROOT'] = $configData['infomaniak_paths']['domain_root'];
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

// Vérifions si la fonction cleanUTF8 n'existe pas déjà avant de la déclarer
if (!function_exists('cleanUTF8')) {
    // Fonction pour nettoyer et convertir en UTF-8
    function cleanUTF8($input) {
        return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
    }
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

// Fonction pour ajuster les chemins en fonction de l'environnement Infomaniak
function adjustPathForInfomaniak($path) {
    // Si nous sommes sur Infomaniak et que le chemin ne commence pas par /sites/
    if (env('IS_INFOMANIAK') === 'true' && strpos($path, '/sites/') !== 0) {
        return env('INFOMANIAK_SITE_ROOT') . $path;
    }
    return $path;
}
?>
