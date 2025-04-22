
<?php
// Définir explicitement le type de contenu pour éviter les problèmes d'interprétation
header('Content-Type: text/plain; charset=utf-8');

// Activer le rapport d'erreurs pour le diagnostic
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Message principal - Si ce message s'affiche, PHP fonctionne
echo "TEST PHP: Si vous voyez ce message, PHP est correctement interprété!\n";
echo "Heure du serveur: " . date('Y-m-d H:i:s') . "\n";
echo "Version PHP: " . phpversion() . "\n";
echo "Serveur: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu') . "\n\n";

// Déterminer dynamiquement la racine et vérifier la structure des fichiers
$root_dir = realpath(dirname(__FILE__));
$api_dir = $root_dir . '/api';
$api_assets_check = $api_dir . '/assets-check.php';

// Vérifier si le fichier API assets-check.php existe
if (file_exists($api_assets_check)) {
    echo "Le fichier api/assets-check.php existe. Exécution...\n\n";
    include_once $api_assets_check;
} else {
    echo "ERREUR: Le fichier api/assets-check.php n'existe pas à " . $api_assets_check . "\n";
    
    // Informations de diagnostic de base
    echo "\nInformations de diagnostic de base:\n";
    echo "- Répertoire racine: " . $root_dir . "\n";
    
    // Vérification des répertoires essentiels
    $dist_dir = $root_dir . '/dist';
    $assets_dir = $dist_dir . '/assets';
    $src_dir = $root_dir . '/src';
    
    echo "\nVérification des répertoires:\n";
    echo "- Répertoire dist: " . (is_dir($dist_dir) ? "Existe" : "Manquant") . "\n";
    echo "- Répertoire assets: " . (is_dir($assets_dir) ? "Existe" : "Manquant") . "\n";
    echo "- Répertoire API: " . (is_dir($api_dir) ? "Existe" : "Manquant") . "\n";
    echo "- Répertoire src: " . (is_dir($src_dir) ? "Existe" : "Manquant") . "\n";
    
    // Vérification des fichiers essentiels
    echo "\nVérification des fichiers:\n";
    echo "- .htaccess: " . (file_exists($root_dir . '/.htaccess') ? "Existe" : "Manquant") . "\n";
    echo "- api/.htaccess: " . (file_exists($api_dir . '/.htaccess') ? "Existe" : "Manquant") . "\n";
    echo "- index.html: " . (file_exists($root_dir . '/index.html') ? "Existe" : "Manquant") . "\n";
    echo "- main.tsx: " . (file_exists($src_dir . '/main.tsx') ? "Existe" : "Manquant") . "\n";
    
    // Vérification des configurations PHP
    echo "\nVérification des configurations PHP:\n";
    echo "- php.ini (racine): " . (file_exists($root_dir . '/php.ini') ? "Existe" : "Manquant") . "\n";
    echo "- .user.ini (racine): " . (file_exists($root_dir . '/.user.ini') ? "Existe" : "Manquant") . "\n";
    echo "- api/php.ini: " . (file_exists($api_dir . '/php.ini') ? "Existe" : "Manquant") . "\n";
    echo "- api/.user.ini: " . (file_exists($api_dir . '/.user.ini') ? "Existe" : "Manquant") . "\n";
}

echo "\nDiagnostic PHP:\n";
echo "- API PHP: " . php_sapi_name() . "\n";
echo "- Fichier php.ini chargé: " . (php_ini_loaded_file() ?: 'Aucun') . "\n";

echo "\nPour résoudre les problèmes d'interprétation PHP, assurez-vous que:\n";
echo "1. Le module PHP est activé sur votre serveur\n";
echo "2. Les fichiers .htaccess sont correctement configurés\n";
echo "3. Le handler PHP est correctement associé aux fichiers .php\n";
echo "4. Essayez d'accéder directement à php-test-simple.php pour tester\n";
?>
