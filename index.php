
<?php
// Point d'entrée minimaliste
header('Content-Type: text/html; charset=utf-8');

// Fonction pour lister les fichiers dans un répertoire
function listFiles($dir, $pattern) {
    $matches = [];
    if (is_dir($dir)) {
        $files = scandir($dir);
        foreach ($files as $file) {
            if (preg_match($pattern, $file)) {
                $matches[] = $file;
            }
        }
    }
    return $matches;
}

// Détection des fichiers CSS et JS avec hachage
$assetsDir = __DIR__ . '/dist/assets';
$cssFiles = listFiles($assetsDir, '/^index[^.]*.css$/');
$cssFile = !empty($cssFiles) ? $cssFiles[0] : 'index.css';

$jsFiles = listFiles($assetsDir, '/^index[^.]*\.js$/');
$jsFile = !empty($jsFiles) ? $jsFiles[0] : 'index.js';

// Filtrer pour exclure les fichiers comme index.es-*.js
$mainJsFiles = [];
foreach ($jsFiles as $file) {
    if (strpos($file, '.es-') === false) {
        $mainJsFiles[] = $file;
    }
}
if (!empty($mainJsFiles)) {
    $jsFile = $mainJsFiles[0];
}

// Servir le contenu HTML
echo '<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FormaCert</title>
    <link rel="icon" href="/lovable-uploads/formacert-logo.png" type="image/png">
    
    <!-- CSS avec détection automatique -->
    <link rel="stylesheet" href="/dist/assets/' . htmlspecialchars($cssFile) . '">
</head>
<body>
    <div id="root"></div>
    
    <!-- Script Lovable -->
    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
    
    <!-- Script principal avec détection auto -->
    <script type="module" src="/dist/assets/' . htmlspecialchars($jsFile) . '"></script>
    
    <!-- Message d\'erreur après 5 secondes si l\'application n\'a pas chargé -->
    <script>
    setTimeout(function() {
      if (document.getElementById("root").childElementCount === 0) {
        document.getElementById("root").innerHTML = `
          <div style="max-width:800px; margin:50px auto; padding:20px; font-family:sans-serif; line-height:1.5; color:#333; background:#f9f9f9; border:1px solid #ddd; border-radius:8px;">
            <h1 style="color:#d33;">Erreur de chargement de l\'application</h1>
            <p>L\'application n\'a pas pu être chargée correctement. Cela peut être dû à un problème avec les fichiers statiques.</p>
            <h3>Fichiers détectés:</h3>
            <p>CSS: ' . htmlspecialchars($cssFile) . '</p>
            <p>JS: ' . htmlspecialchars($jsFile) . '</p>
            <h3>Diagnostics recommandés:</h3>
            <ul>
              <li><a href="/assets-check.php" style="color:#0066cc;">Page de diagnostic des assets</a></li>
            </ul>
          </div>
        `;
      }
    }, 5000);
    </script>
</body>
</html>';
?>
