
<?php
// Fichier d'exemple de configuration d'environnement
// Copiez ce fichier vers env.php et modifiez selon votre environnement

// Définir l'environnement manuellement
// $_ENV['APP_ENV'] = 'development'; // Ou 'production'

// Détecter automatiquement l'environnement (recommandé)
$currentHost = $_SERVER['HTTP_HOST'] ?? '';
$_ENV['APP_ENV'] = (strpos($currentHost, 'qualiopi.ch') !== false) ? 'production' : 'development';

// Configuration API
$_ENV['API_URL_DEV'] = 'http://localhost:8080/api';
$_ENV['API_URL_PROD'] = 'https://www.qualiopi.ch/api';

// Configuration CORS
$_ENV['ALLOWED_ORIGIN_DEV'] = 'http://localhost:8080';
$_ENV['ALLOWED_ORIGIN_PROD'] = 'https://www.qualiopi.ch';

// Fonction d'aide pour obtenir une variable d'environnement
function env($key, $default = null) {
    return $_ENV[$key] ?? $default;
}
?>
