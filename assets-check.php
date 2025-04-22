
<?php
// Version simplifiée du script de vérification avec gestion d'erreurs améliorée
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Définir explicitement le type de contenu
header('Content-Type: text/plain; charset=utf-8');

// Message de base
echo "TEST PHP FORMACERT\n";
echo "=================\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n\n";

// Vérifications de base
echo "VÉRIFICATIONS DE BASE:\n";
echo "- Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible') . "\n";
echo "- Script Path: " . ($_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible') . "\n";

// Vérifier les répertoires clés
$root_dir = dirname(__FILE__);
$dist_dir = $root_dir . '/dist';
$api_dir = $root_dir . '/api';

echo "\nRÉPERTOIRES:\n";
echo "- Racine: " . (is_dir($root_dir) ? "OK" : "ERREUR") . "\n";
echo "- Dist: " . (is_dir($dist_dir) ? "OK" : "MANQUANT") . "\n";
echo "- API: " . (is_dir($api_dir) ? "OK" : "MANQUANT") . "\n";

// Vérifier les fichiers essentiels
echo "\nFICHIERS ESSENTIELS:\n";
echo "- index.html: " . (file_exists($root_dir . '/index.html') ? "OK" : "MANQUANT") . "\n";
echo "- .htaccess: " . (file_exists($root_dir . '/.htaccess') ? "OK" : "MANQUANT") . "\n";
echo "- api/.htaccess: " . (file_exists($api_dir . '/.htaccess') ? "OK" : "MANQUANT") . "\n";

// Si dist existe, lister quelques fichiers
if (is_dir($dist_dir)) {
    $assets_dir = $dist_dir . '/assets';
    echo "\nDIST/ASSETS: " . (is_dir($assets_dir) ? "OK" : "MANQUANT") . "\n";
    
    if (is_dir($assets_dir)) {
        $js_files = glob($assets_dir . '/*.js');
        $css_files = glob($assets_dir . '/*.css');
        
        echo "- Fichiers JS: " . count($js_files) . "\n";
        echo "- Fichiers CSS: " . count($css_files) . "\n";
    }
}

echo "\nCe test a été exécuté avec succès. Si vous voyez ce message, l'interprétation PHP fonctionne.";
?>
