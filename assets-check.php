
<?php
// Version améliorée du script de vérification avec gestion des fichiers hachés
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Définir explicitement le type de contenu
header('Content-Type: text/html; charset=utf-8');

// Message de base
echo "<!DOCTYPE html>
<html>
<head>
    <title>Vérification des Assets</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #333; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>TEST DES ASSETS FORMACERT</h1>
    <p>PHP Version: " . phpversion() . "</p>
    <p>Date: " . date('Y-m-d H:i:s') . "</p>";

// Vérifications de base
echo "<h2>VÉRIFICATIONS DE BASE</h2>";
echo "<p>Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible') . "</p>";
echo "<p>Script Path: " . ($_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible') . "</p>";

// Vérifier les répertoires clés
$root_dir = dirname(__FILE__);
$dist_dir = $root_dir . '/dist';
$assets_dir = $dist_dir . '/assets';

echo "<h2>RÉPERTOIRES</h2>";
echo "<ul>";
echo "<li>Racine: " . (is_dir($root_dir) ? "<span class='success'>OK</span>" : "<span class='error'>ERREUR</span>") . "</li>";
echo "<li>Dist: " . (is_dir($dist_dir) ? "<span class='success'>OK</span>" : "<span class='error'>MANQUANT</span>") . "</li>";
echo "<li>Assets: " . (is_dir($assets_dir) ? "<span class='success'>OK</span>" : "<span class='error'>MANQUANT</span>") . "</li>";
echo "<li>API: " . (is_dir($root_dir . '/api') ? "<span class='success'>OK</span>" : "<span class='error'>MANQUANT</span>") . "</li>";
echo "</ul>";

// Vérifier les fichiers essentiels
echo "<h2>FICHIERS ESSENTIELS</h2>";
echo "<ul>";
echo "<li>index.html: " . (file_exists($root_dir . '/index.html') ? "<span class='success'>OK</span>" : "<span class='error'>MANQUANT</span>") . "</li>";
echo "<li>index.php: " . (file_exists($root_dir . '/index.php') ? "<span class='success'>OK</span>" : "<span class='error'>MANQUANT</span>") . "</li>";
echo "<li>.htaccess: " . (file_exists($root_dir . '/.htaccess') ? "<span class='success'>OK</span>" : "<span class='error'>MANQUANT</span>") . "</li>";
echo "</ul>";

// Si dist/assets existe, analyser son contenu
if (is_dir($assets_dir)) {
    echo "<h2>CONTENU DU DOSSIER ASSETS</h2>";
    echo "<table>";
    echo "<tr><th>Fichier</th><th>Taille</th><th>Type</th><th>État</th></tr>";
    
    $files = scandir($assets_dir);
    $foundIndexJs = false;
    $foundIndexCss = false;
    $indexJsPattern = '/^index[^.]*\.js$/';
    $indexCssPattern = '/^index[^.]*\.css$/';
    
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            $fileSize = filesize("$assets_dir/$file");
            $fileType = '';
            $state = '';
            
            // Déterminer le type de fichier
            if (preg_match('/\.js$/', $file)) {
                $fileType = 'JavaScript';
                if (preg_match($indexJsPattern, $file) && !strpos($file, '.es-')) {
                    $foundIndexJs = true;
                    $state = "<span class='success'>Principal JS</span>";
                }
            } else if (preg_match('/\.css$/', $file)) {
                $fileType = 'CSS';
                if (preg_match($indexCssPattern, $file)) {
                    $foundIndexCss = true;
                    $state = "<span class='success'>Principal CSS</span>";
                }
            }
            
            echo "<tr>";
            echo "<td>$file</td>";
            echo "<td>" . round($fileSize / 1024, 2) . " KB</td>";
            echo "<td>$fileType</td>";
            echo "<td>$state</td>";
            echo "</tr>";
        }
    }
    echo "</table>";
    
    // Vérifier si on a trouvé les fichiers principaux
    echo "<h2>ANALYSE DES FICHIERS CRITIQUES</h2>";
    echo "<ul>";
    echo "<li>Fichier JS principal (index*.js): " . ($foundIndexJs ? "<span class='success'>TROUVÉ</span>" : "<span class='error'>MANQUANT</span>") . "</li>";
    echo "<li>Fichier CSS principal (index*.css): " . ($foundIndexCss ? "<span class='success'>TROUVÉ</span>" : "<span class='error'>MANQUANT</span>") . "</li>";
    echo "</ul>";
    
    if (!$foundIndexJs || !$foundIndexCss) {
        echo "<h2>RECOMMANDATIONS</h2>";
        echo "<p><span class='warning'>ATTENTION</span>: Les fichiers principaux de l'application semblent être nommés avec des hachages, mais l'application les cherche sans ces hachages.</p>";
        echo "<p>Vous devriez:</p>";
        echo "<ol>";
        echo "<li>Vérifier la configuration dans vite.config.ts pour la génération des assets</li>";
        echo "<li>Utiliser le fichier index.php amélioré qui détecte automatiquement les noms des fichiers hachés</li>";
        echo "</ol>";
    }
} else {
    echo "<h2><span class='error'>ERREUR: LE DOSSIER ASSETS N'EXISTE PAS</span></h2>";
    echo "<p>Vous devez exécuter 'npm run build' pour générer les fichiers statiques.</p>";
    echo "<p>Ou télécharger manuellement le dossier dist avec ses fichiers.</p>";
}

// Vérifier la configuration de vite
$vite_config = $root_dir . '/vite.config.ts';
if (file_exists($vite_config)) {
    echo "<h2>CONFIGURATION VITE</h2>";
    $config_content = file_get_contents($vite_config);
    echo "<pre>" . htmlspecialchars(substr($config_content, 0, 1000)) . "...</pre>";
    echo "<ul>";
    echo "<li>Configuration du build: " . (strpos($config_content, "build:") !== false ? "<span class='success'>Présente</span>" : "<span class='error'>Manquante</span>") . "</li>";
    echo "<li>outDir: " . (strpos($config_content, "outDir: 'dist'") !== false ? "<span class='success'>OK</span>" : "<span class='warning'>Non spécifié ou différent</span>") . "</li>";
    echo "<li>assetsDir: " . (strpos($config_content, "assetsDir: 'assets'") !== false ? "<span class='success'>OK</span>" : "<span class='warning'>Non spécifié ou différent</span>") . "</li>";
    
    // Vérifier la configuration de hachage des fichiers
    $hashedConfig = strpos($config_content, "assetFileNames:") !== false || strpos($config_content, "entryFileNames:") !== false;
    echo "<li>Configuration de hachage des fichiers: " . ($hashedConfig ? "<span class='warning'>Présente - génère des noms de fichiers avec hachage</span>" : "<span class='success'>Non spécifiée</span>") . "</li>";
    echo "</ul>";
    
    if ($hashedConfig) {
        echo "<p><span class='warning'>RECOMMANDATION</span>: Votre configuration Vite génère des noms de fichiers avec hachage. Assurez-vous que votre index.html et index.php sont capables de détecter ces noms dynamiquement.</p>";
    }
}

echo "<h2>CONCLUSION</h2>";
if (is_dir($assets_dir) && $foundIndexJs && $foundIndexCss) {
    echo "<p><span class='success'>✅ Tous les fichiers nécessaires sont présents.</span></p>";
} else {
    echo "<p><span class='error'>❌ Certains fichiers critiques sont manquants ou mal nommés.</span></p>";
}

echo "<p>Ce test a été exécuté avec succès. Si vous voyez ce message, cela signifie que l'interprétation PHP fonctionne correctement.</p>";
echo "</body></html>";
?>
