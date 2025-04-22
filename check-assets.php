
<?php
// Script de diagnostic pour les assets statiques
header('Content-Type: text/plain; charset=utf-8');

echo "=== VÉRIFICATION DES ASSETS STATIQUES ===\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n\n";

$root_dir = __DIR__;
$dist_dir = $root_dir . '/dist';
$assets_dir = $dist_dir . '/assets';

echo "CHEMINS\n";
echo "- Racine: $root_dir\n";
echo "- Dist: $dist_dir\n";
echo "- Assets: $assets_dir\n\n";

echo "VÉRIFICATION DES DOSSIERS\n";
echo "- Dossier dist: " . (is_dir($dist_dir) ? "EXISTE" : "MANQUANT") . "\n";
echo "- Dossier assets: " . (is_dir($assets_dir) ? "EXISTE" : "MANQUANT") . "\n";

if (is_dir($assets_dir)) {
    echo "\nCONTENU DU DOSSIER ASSETS\n";
    $files = scandir($assets_dir);
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            echo "- $file (" . filesize("$assets_dir/$file") . " octets)\n";
        }
    }
}

echo "\nVÉRIFICATION DES FICHIERS CRITIQUES\n";
echo "- index.css: " . (file_exists("$assets_dir/index.css") ? "EXISTE" : "MANQUANT") . "\n";
echo "- index.js: " . (file_exists("$assets_dir/index.js") ? "EXISTE" : "MANQUANT") . "\n";

if (!is_dir($dist_dir)) {
    echo "\nRECOMMANDATION\n";
    echo "Le dossier dist n'existe pas. Vous devez exécuter 'npm run build' pour générer les fichiers statiques.\n";
    echo "Sinon, créez manuellement la structure de dossiers :\n";
    echo "mkdir -p dist/assets\n";
}

echo "\nVérification terminée. Si des fichiers sont manquants, vous devez les générer ou les télécharger.";
?>
