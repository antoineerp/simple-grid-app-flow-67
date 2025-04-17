<?php
// Fichier de configuration d'environnement
// Ne pas versionner ce fichier dans git

// Déterminer l'environnement en fonction du nom d'hôte
$currentHost = $_SERVER['HTTP_HOST'] ?? '';

// Définir l'environnement par défaut
$environment = 'development';

// Détecter l'environnement en fonction du nom d'hôte
if (strpos($currentHost, 'qualiopi.ch') !== false) {
    $environment = 'production';
} elseif (strpos($currentHost, 'localhost') !== false) {
    $environment = 'development';
}

// Définir les variables d'environnement
$_ENV['APP_ENV'] = $environment;

// Configuration API
$_ENV['API_URL_DEV'] = 'http://localhost:8080/api';
$_ENV['API_URL_PROD'] = 'https://www.qualiopi.ch/api';

// Configuration CORS
$_ENV['ALLOWED_ORIGIN_DEV'] = 'http://localhost:8080';
$_ENV['ALLOWED_ORIGIN_PROD'] = 'https://www.qualiopi.ch';

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
