
<?php
// Configuration complète pour un environnement de production avec JSON

// Détecter automatiquement l'environnement (avec possibilité de forçage manuel)
$currentHost = $_SERVER['HTTP_HOST'] ?? '';
$_ENV['APP_ENV'] = (strpos($currentHost, 'qualiopi.ch') !== false) ? 'production' : 'development';

// Configuration API - URLs production
$_ENV['API_URL_PROD'] = 'https://qualiopi.ch/api';
$_ENV['ALLOWED_ORIGIN_PROD'] = 'https://qualiopi.ch';

// Configuration spécifique Infomaniak
$_ENV['INFOMANIAK_SITE_ROOT'] = '/sites/qualiopi.ch';
$_ENV['INFOMANIAK_DOMAIN_ROOT'] = '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch';

// Configuration de sécurité JSON
$_ENV['JSON_HEADER'] = 'application/json; charset=UTF-8';
$_ENV['CORS_ALLOWED_METHODS'] = 'GET, POST, PUT, DELETE, OPTIONS';
$_ENV['CORS_ALLOWED_HEADERS'] = 'Content-Type, Authorization, X-Requested-With';

// Configuration de l'encodage et des erreurs
ini_set('default_charset', 'UTF-8');
mb_internal_encoding('UTF-8');

// Configuration de production stricte
ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/php-errors.log');

// Configurer les en-têtes de sécurité JSON
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Fonction d'aide pour obtenir une variable d'environnement sécurisée
function env($key, $default = null) {
    return $_ENV[$key] ?? $default;
}

// Fonction pour nettoyer et convertir en UTF-8 de manière sécurisée
function cleanUTF8($input) {
    if (is_string($input)) {
        return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
    }
    return $input;
}

// Fonction pour ajuster les chemins en fonction de l'environnement Infomaniak
function adjustPathForInfomaniak($path) {
    return env('INFOMANIAK_SITE_ROOT') . $path;
}
