
<?php
// Configuration des variables d'environnement pour l'application
// Création depuis env.example.php

// Définir l'environnement manuellement
$_ENV['APP_ENV'] = 'development';

// Détecter automatiquement l'environnement (recommandé)
$currentHost = $_SERVER['HTTP_HOST'] ?? '';
$_ENV['APP_ENV'] = (strpos($currentHost, 'qualiopi.ch') !== false) ? 'production' : 'development';

// Configuration API
$_ENV['API_URL_DEV'] = 'http://localhost:8080/api';
$_ENV['API_URL_PROD'] = 'https://www.qualiopi.ch/api';

// Configuration CORS
$_ENV['ALLOWED_ORIGIN_DEV'] = 'http://localhost:8080';
$_ENV['ALLOWED_ORIGIN_PROD'] = 'https://www.qualiopi.ch';

// Configuration base de données
define('DB_HOST', 'p71x6d.myd.infomaniak.com');
define('DB_NAME', 'p71x6d_system');
define('DB_USER', 'p71x6d_system');
define('DB_PASS', 'Trottinette43!');
define('API_BASE_URL', '/api');

// Fonction d'aide pour obtenir une variable d'environnement
function env($key, $default = null) {
    return $_ENV[$key] ?? $default;
}

// Fonction d'aide pour récupérer les variables d'environnement
function get_env($key, $default = null) {
    $const_name = strtoupper($key);
    if (defined($const_name)) {
        return constant($const_name);
    }
    return $_ENV[$key] ?? $default;
}

// Fonction pour nettoyer les entrées UTF-8 (utilisée dans plusieurs fichiers)
if (!function_exists('cleanUTF8')) {
    function cleanUTF8($input) {
        if (is_array($input)) {
            $result = array();
            foreach ($input as $key => $value) {
                $result[$key] = cleanUTF8($value);
            }
            return $result;
        }
        
        if (is_string($input)) {
            return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
        }
        
        return $input;
    }
}
?>
