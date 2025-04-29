
<?php
// Script pour créer les fichiers manquants essentiels
// Ce script crée les fichiers nécessaires au fonctionnement de l'API

// En-têtes pour éviter la mise en cache et permettre les accès CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Structure des fichiers à créer s'ils n'existent pas
$files_to_check = [
    // Fichiers de configuration
    'env.php' => [
        'path' => __DIR__ . '/env.php',
        'content' => <<<'PHP'
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
PHP
    ]
];

// Vérifier et créer les fichiers manquants
$results = [];
foreach ($files_to_check as $name => $file_info) {
    $path = $file_info['path'];
    $exists = file_exists($path);
    
    if (!$exists) {
        // Assurer que le répertoire existe
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        // Créer le fichier
        $success = file_put_contents($path, $file_info['content']);
        
        $results[$name] = [
            'status' => $success ? 'created' : 'error',
            'message' => $success 
                ? "Fichier $name créé avec succès" 
                : "Échec de création du fichier $name",
            'path' => $path
        ];
    } else {
        $results[$name] = [
            'status' => 'exists',
            'message' => "Le fichier $name existe déjà",
            'path' => $path
        ];
    }
}

// Résumé des résultats
$created_count = 0;
$error_count = 0;
$existing_count = 0;

foreach ($results as $result) {
    if ($result['status'] === 'created') {
        $created_count++;
    } else if ($result['status'] === 'error') {
        $error_count++;
    } else if ($result['status'] === 'exists') {
        $existing_count++;
    }
}

$summary = [
    'total' => count($files_to_check),
    'created' => $created_count,
    'errors' => $error_count,
    'existing' => $existing_count,
    'message' => "Traitement terminé: $created_count fichier(s) créé(s), $error_count erreur(s), $existing_count fichier(s) existant(s)"
];

// Retourner les résultats
echo json_encode([
    'summary' => $summary,
    'details' => $results
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
