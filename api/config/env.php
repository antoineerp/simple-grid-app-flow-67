
<?php
// Forcer l'environnement de production
$_ENV['APP_ENV'] = 'production';

// Configuration API pour la production uniquement
$_ENV['API_URL_PROD'] = 'https://qualiopi.ch/api';
$_ENV['ALLOWED_ORIGIN_PROD'] = 'https://qualiopi.ch';

// Configuration des chemins pour Infomaniak
$_ENV['INFOMANIAK_SITE_ROOT'] = '/sites/qualiopi.ch';
$_ENV['INFOMANIAK_DOMAIN_ROOT'] = '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch';

// Définir explicitement que nous sommes sur Infomaniak
$_ENV['IS_INFOMANIAK'] = 'true';

// Configuration de l'encodage
ini_set('default_charset', 'UTF-8');
mb_internal_encoding('UTF-8');

// Configuration de production
ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/php-errors.log');

// Fonction pour nettoyer et convertir en UTF-8
if (!function_exists('cleanUTF8')) {
    function cleanUTF8($input) {
        return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
    }
}

// Fonction d'aide pour obtenir une variable d'environnement
function env($key, $default = null) {
    return $_ENV[$key] ?? $default;
}

// Fonction pour ajuster les chemins en fonction de l'environnement Infomaniak
function adjustPathForInfomaniak($path) {
    return env('INFOMANIAK_SITE_ROOT') . $path;
}
?>
