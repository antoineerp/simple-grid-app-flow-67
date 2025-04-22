
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
$assets_dir = $dist_dir . '/assets';

echo "\nRÉPERTOIRES:\n";
echo "- Racine: " . (is_dir($root_dir) ? "OK" : "ERREUR") . "\n";
echo "- Dist: " . (is_dir($dist_dir) ? "OK" : "MANQUANT") . "\n";
echo "- API: " . (is_dir($root_dir . '/api') ? "OK" : "MANQUANT") . "\n";

// Vérifier les fichiers essentiels
echo "\nFICHIERS ESSENTIELS:\n";
echo "- index.html: " . (file_exists($root_dir . '/index.html') ? "OK" : "MANQUANT") . "\n";
echo "- .htaccess: " . (file_exists($root_dir . '/.htaccess') ? "OK" : "MANQUANT") . "\n";

// Si dist existe, lister quelques fichiers
if (is_dir($dist_dir)) {
    $assets_dir = $dist_dir . '/assets';
    echo "\nDIST/ASSETS: " . (is_dir($assets_dir) ? "OK" : "MANQUANT") . "\n";
    
    if (is_dir($assets_dir)) {
        $files = scandir($assets_dir);
        echo "CONTENU DU DOSSIER ASSETS:\n";
        foreach ($files as $file) {
            if ($file != '.' && $file != '..') {
                echo "- $file (" . filesize("$assets_dir/$file") . " octets)\n";
            }
        }
        
        // Vérifier spécifiquement index.js et index.css
        echo "\nFICHIERS CRITIQUES:\n";
        echo "- index.js: " . (file_exists("$assets_dir/index.js") ? "OK" : "MANQUANT") . "\n";
        echo "- index.css: " . (file_exists("$assets_dir/index.css") ? "OK" : "MANQUANT") . "\n";
        
        // Vérifier pour main.js et main.css (alternative courante)
        echo "- main.js: " . (file_exists("$assets_dir/main.js") ? "OK" : "MANQUANT") . "\n";
        echo "- main.css: " . (file_exists("$assets_dir/main.css") ? "OK" : "MANQUANT") . "\n";
        
        // Si index.js est manquant mais main.js existe
        if (!file_exists("$assets_dir/index.js") && file_exists("$assets_dir/main.js")) {
            echo "\nRECOMMANDATION: Le fichier index.js est manquant mais main.js existe.\n";
            echo "Vous devriez modifier index.html et index.php pour utiliser main.js au lieu de index.js.\n";
        }
    } else {
        echo "Le dossier assets n'existe pas.\n";
    }
} else {
    echo "\nRECOMMANDATION: Le dossier dist n'existe pas.\n";
    echo "Vous devez exécuter 'npm run build' pour générer les fichiers statiques.\n";
    echo "Ou télécharger manuellement le dossier dist avec ses fichiers.\n";
}

// Vérifier la configuration de vite.config.ts
$vite_config = $root_dir . '/vite.config.ts';
if (file_exists($vite_config)) {
    echo "\nCONFIGURATION VITE:\n";
    $config_content = file_get_contents($vite_config);
    echo "- Configuration du build: " . (strpos($config_content, "build:") !== false ? "Présente" : "Manquante") . "\n";
    echo "- outDir: " . (strpos($config_content, "outDir: 'dist'") !== false ? "OK" : "Non spécifié") . "\n";
    echo "- assetsDir: " . (strpos($config_content, "assetsDir: 'assets'") !== false ? "OK" : "Non spécifié") . "\n";
}

echo "\nCe test a été exécuté avec succès. Si vous voyez ce message, cela signifie que l'interprétation PHP fonctionne.";
?>
