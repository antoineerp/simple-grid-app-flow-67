
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour rechercher les fichiers CSS
function findCssFiles($directory) {
    $cssFiles = [];
    if (is_dir($directory)) {
        $files = scandir($directory);
        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..' && is_file($directory . '/' . $file)) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'css') {
                    $cssFiles[] = $directory . '/' . $file;
                }
            }
        }
    }
    return $cssFiles;
}

// Vérifier si le dossier assets existe, sinon le créer
if (!is_dir('assets')) {
    mkdir('assets', 0755, true);
    echo "<p>Dossier assets créé.</p>";
}

// Rechercher les fichiers CSS dans le dossier assets
$assetsCssFiles = findCssFiles('assets');
echo "<p>Fichiers CSS dans assets: " . count($assetsCssFiles) . "</p>";

// Vérifier si main.css est dans assets
$mainCssExists = false;
foreach ($assetsCssFiles as $file) {
    if (basename($file) === 'main.css') {
        $mainCssExists = true;
        echo "<p>main.css trouvé dans assets.</p>";
        break;
    }
}

// Si main.css n'existe pas dans assets, chercher dans dist/assets
if (!$mainCssExists) {
    echo "<p>main.css non trouvé dans assets, recherche dans dist/assets...</p>";
    
    // Vérifier si le dossier dist/assets existe
    $distAssetsCssFiles = [];
    if (is_dir('dist/assets')) {
        $distAssetsCssFiles = findCssFiles('dist/assets');
        echo "<p>Fichiers CSS dans dist/assets: " . count($distAssetsCssFiles) . "</p>";
        
        // Copier tous les CSS de dist/assets vers assets
        foreach ($distAssetsCssFiles as $file) {
            $destination = 'assets/' . basename($file);
            if (copy($file, $destination)) {
                echo "<p>✅ Copié: " . basename($file) . " vers assets/</p>";
            } else {
                echo "<p>❌ Erreur de copie: " . basename($file) . "</p>";
            }
        }
    } else {
        echo "<p>Le dossier dist/assets n'existe pas.</p>";
    }
    
    // Vérifier si main.css existe maintenant dans assets
    if (file_exists('assets/main.css')) {
        echo "<p>✅ main.css est maintenant dans assets.</p>";
    } else {
        // Créer un fichier main.css de secours si nécessaire
        echo "<p>Création d'un fichier main.css de secours...</p>";
        $fallbackCss = "/* Fichier CSS de secours créé automatiquement */\n";
        $fallbackCss .= "body {\n  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n  color: #333;\n  background-color: #f9fafb;\n  margin: 0;\n  padding: 0;\n}\n";
        $fallbackCss .= "#root {\n  max-width: 1280px;\n  margin: 0 auto;\n  padding: 2rem;\n}\n";
        
        file_put_contents('assets/main.css', $fallbackCss);
        echo "<p>✅ Fichier de secours assets/main.css créé.</p>";
    }
}

// Vérifier dans index.html si le fichier CSS est bien référencé
$indexHtml = file_get_contents('index.html');
if (strpos($indexHtml, 'href="/assets/main.css"') === false) {
    echo "<p>Référence vers /assets/main.css non trouvée dans index.html.</p>";
    
    // Ajouter la référence au CSS dans le head si nécessaire
    $updatedHtml = preg_replace('/<\/head>/', '  <link rel="stylesheet" href="/assets/main.css">' . "\n  </head>", $indexHtml);
    if ($updatedHtml !== $indexHtml) {
        file_put_contents('index.html', $updatedHtml);
        echo "<p>✅ Référence à /assets/main.css ajoutée dans index.html.</p>";
    }
}

echo "<h2>Diagnostic CSS terminé</h2>";
echo "<p><a href='/'>Retourner à l'accueil</a></p>";
?>
