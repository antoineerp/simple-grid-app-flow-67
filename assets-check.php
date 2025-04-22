
<?php
// Explicitement définir le contenu comme texte brut pour éviter les téléchargements
header('Content-Type: text/plain');

// Activer le rapport d'erreurs pour le diagnostic
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Vérifier que PHP fonctionne correctement
echo "TEST PHP: Si vous voyez ce message, PHP est correctement interprété!\n";
echo "Heure du serveur: " . date('Y-m-d H:i:s') . "\n";
echo "Version PHP: " . phpversion() . "\n";
echo "Serveur: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu') . "\n\n";

// Déterminer dynamiquement la racine et vérifier le fichier de diagnostic
$root_dir = realpath(dirname(__FILE__));
$api_assets_check = $root_dir . '/api/assets-check.php';

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
    $api_dir = $root_dir . '/api';
    
    echo "\nVérification des répertoires:\n";
    echo "- Répertoire dist: " . (is_dir($dist_dir) ? "Existe" : "Manquant") . "\n";
    echo "- Répertoire assets: " . (is_dir($assets_dir) ? "Existe" : "Manquant") . "\n";
    echo "- Répertoire API: " . (is_dir($api_dir) ? "Existe" : "Manquant") . "\n";
    
    // Vérification des fichiers essentiels
    echo "\nVérification des fichiers:\n";
    echo "- .htaccess: " . (file_exists($root_dir . '/.htaccess') ? "Existe" : "Manquant") . "\n";
    echo "- index.html: " . (file_exists($root_dir . '/index.html') ? "Existe" : "Manquant") . "\n";
    echo "- main.tsx: " . (file_exists($root_dir . '/src/main.tsx') ? "Existe" : "Manquant") . "\n";
}

echo "\nPour résoudre les problèmes d'interprétation PHP, assurez-vous que votre serveur est configuré pour interpréter PHP.";
echo "\nVérifiez également que le module mod_php est activé dans Apache.";
?>
