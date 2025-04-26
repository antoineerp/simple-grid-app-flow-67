
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

// Détecter automatiquement le chemin complet sur Infomaniak
$documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
$scriptFilename = $_SERVER['SCRIPT_FILENAME'] ?? '';

// Détecter Infomaniak et configurer les chemins
$isInfomaniak = preg_match('#^(/home/clients/[^/]+/sites/[^/]+)/#', $documentRoot, $matches);
if ($isInfomaniak) {
    $_ENV['INFOMANIAK_DOMAIN_ROOT'] = $matches[1];
    $_ENV['IS_INFOMANIAK'] = 'true';
    error_log("Détection automatique du chemin Infomaniak: " . $_ENV['INFOMANIAK_DOMAIN_ROOT']);
    
    // Configurer les chemins avec la bonne structure détectée
    $_ENV['ASSETS_PATH'] = '/assets';
    $_ENV['UPLOADS_PATH'] = '/lovable-uploads';
    
    error_log("Infomaniak détecté: Chemins configurés: ASSETS=" . $_ENV['ASSETS_PATH'] . ", UPLOADS=" . $_ENV['UPLOADS_PATH']);
} else {
    // Environnement local ou autre
    $_ENV['IS_INFOMANIAK'] = 'false';
    $_ENV['ASSETS_PATH'] = '/assets';
    $_ENV['UPLOADS_PATH'] = '/lovable-uploads';
    
    error_log("Environnement non-Infomaniak: Chemins par défaut utilisés");
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
    // Utiliser E_ALL & ~E_DEPRECATED au lieu de E_ALL & ~E_DEPRECATED & ~E_STRICT
    // car E_STRICT est déprécié dans les versions récentes de PHP
    error_reporting(E_ALL & ~E_DEPRECATED);
    
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

/**
 * Fonction optimisée pour ajuster les chemins en fonction de l'environnement Infomaniak
 * Corrige les problèmes de chemins de fichiers, notamment pour les chemins doublés comme /sites/qualiopi.ch/
 */
function adjustPathForInfomaniak($path) {
    // Vérifier si le chemin est défini
    if (!$path) {
        return $path;
    }
    
    // Détecter si nous sommes sur Infomaniak
    $isInfomaniak = env('IS_INFOMANIAK') === 'true';
    
    if (!$isInfomaniak) {
        return $path; // Pas de modification en environnement non-Infomaniak
    }
    
    // Corriger les chemins avec /sites/domain.com/ (chemins doublés)
    if (preg_match('|^/sites/[^/]+/(.*)$|', $path, $matches)) {
        $correctedPath = '/' . $matches[1];
        error_log("Chemin corrigé: $path -> $correctedPath");
        return $correctedPath;
    }
    
    // Pas besoin de correction
    return $path;
}

/**
 * Fonction pour obtenir l'URL de base de l'application
 */
function getBaseUrl() {
    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    return $protocol . "://" . $host;
}

// Journaliser les chemins des assets en production
if ($environment === 'production') {
    error_log("ASSETS_PATH configuré: " . $_ENV['ASSETS_PATH']);
    error_log("UPLOADS_PATH configuré: " . $_ENV['UPLOADS_PATH']);
    error_log("Application démarrée en environnement de PRODUCTION sur l'hôte: " . $currentHost);
    error_log("API URL: " . ($_ENV['API_URL_PROD'] ?? 'non définie'));
    error_log("ALLOWED ORIGIN: " . ($_ENV['ALLOWED_ORIGIN_PROD'] ?? 'non défini'));
    error_log("DOCUMENT_ROOT: " . $documentRoot);
    error_log("IS_INFOMANIAK: " . ($_ENV['IS_INFOMANIAK'] ?? 'non défini'));
    error_log("INFOMANIAK_DOMAIN_ROOT (détecté auto): " . ($_ENV['INFOMANIAK_DOMAIN_ROOT'] ?? 'non détecté'));
}
?>
