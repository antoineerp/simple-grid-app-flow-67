
<?php
// Fichier de configuration d'environnement

// Déterminer l'environnement en fonction du nom d'hôte
$currentHost = $_SERVER['HTTP_HOST'] ?? '';

// Définir l'environnement par défaut
$environment = 'production'; // Environnement par défaut pour Infomaniak

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
$_ENV['API_URL_PROD'] = 'https://qualiopi.ch/api'; // Changé pour utiliser qualiopi.ch sans www

// Configuration CORS
$_ENV['ALLOWED_ORIGIN_DEV'] = 'http://localhost:8080';
$_ENV['ALLOWED_ORIGIN_PROD'] = 'https://qualiopi.ch'; // Changé pour utiliser qualiopi.ch sans www

// Journaliser l'environnement détecté en production (pour le débogage initial)
if ($environment === 'production') {
    error_log("Application démarrée en environnement de PRODUCTION sur l'hôte: " . $currentHost);
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
