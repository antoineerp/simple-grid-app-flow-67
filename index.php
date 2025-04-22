
<?php
// Point d'entrée avec journalisation améliorée
header('Content-Type: text/html; charset=utf-8');

// Activer la journalisation pour le diagnostic
$logFile = "/tmp/formacert-assets.log";
$debugMode = true; // Activer/désactiver le mode debug

// Fonction de journalisation
function assetLog($message) {
    global $logFile, $debugMode;
    if ($debugMode) {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message\n";
        error_log($logMessage, 3, $logFile);
    }
}

// Journaliser les informations sur la requête
assetLog("=== NOUVELLE REQUÊTE ===");
assetLog("URI: " . $_SERVER['REQUEST_URI']);
assetLog("Host: " . $_SERVER['HTTP_HOST']);
assetLog("User Agent: " . $_SERVER['HTTP_USER_AGENT']);

// Fonction pour lister les fichiers dans un répertoire
function listFiles($dir, $pattern) {
    assetLog("Recherche de fichiers dans $dir avec pattern $pattern");
    $matches = [];
    if (is_dir($dir)) {
        $files = scandir($dir);
        assetLog("Fichiers trouvés: " . implode(", ", $files));
        foreach ($files as $file) {
            if (preg_match($pattern, $file)) {
                $matches[] = $file;
                assetLog("Match trouvé: $file");
            }
        }
    } else {
        assetLog("ERREUR: Le répertoire $dir n'existe pas");
    }
    return $matches;
}

// Vérifier l'existence du dossier dist/assets
$assetsDir = __DIR__ . '/dist/assets';
if (!is_dir($assetsDir)) {
    assetLog("ERREUR CRITIQUE: Le dossier dist/assets n'existe pas!");
    assetLog("Document root: " . __DIR__);
    // Lister les répertoires à la racine pour diagnostic
    $rootDirs = scandir(__DIR__);
    assetLog("Contenu de la racine: " . implode(", ", $rootDirs));
}

// Détection des fichiers CSS et JS (version non hashée ET hashée)
assetLog("Détection des fichiers CSS");
$cssFiles = listFiles($assetsDir, '/^index.*\.css$/');
$cssFile = !empty($cssFiles) ? $cssFiles[0] : 'index.css';
assetLog("Fichier CSS sélectionné: $cssFile");

assetLog("Détection des fichiers JS");
$jsFiles = listFiles($assetsDir, '/^index.*\.js$/');
$jsFile = !empty($jsFiles) ? $jsFiles[0] : 'index.js';

// Filtrer pour exclure les fichiers comme index.es-*.js
$mainJsFiles = [];
foreach ($jsFiles as $file) {
    if (strpos($file, '.es-') === false) {
        $mainJsFiles[] = $file;
        assetLog("Fichier JS principal potentiel: $file");
    }
}
if (!empty($mainJsFiles)) {
    $jsFile = $mainJsFiles[0];
    assetLog("Fichier JS principal sélectionné: $jsFile");
}

// Vérifier si les fichiers existent physiquement
if (!empty($cssFile)) {
    $cssPath = "$assetsDir/$cssFile";
    assetLog("Vérification de l'existence du fichier CSS: $cssPath");
    assetLog("Le fichier existe: " . (file_exists($cssPath) ? "OUI" : "NON"));
}

if (!empty($jsFile)) {
    $jsPath = "$assetsDir/$jsFile";
    assetLog("Vérification de l'existence du fichier JS: $jsPath");
    assetLog("Le fichier existe: " . (file_exists($jsPath) ? "OUI" : "NON"));
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
    
    <!-- Script pour surveiller les erreurs de chargement des ressources -->
    <script>
    window.addEventListener("error", function(e) {
        if (e.target && (e.target.tagName === "LINK" || e.target.tagName === "SCRIPT")) {
            console.error("Erreur de chargement de ressource: ", e.target.src || e.target.href);
            document.getElementById("asset-errors").innerHTML += 
                "<li>Erreur de chargement: " + (e.target.src || e.target.href) + "</li>";
        }
    }, true);
    </script>
</head>
<body>
    <div id="root"></div>
    
    <!-- Conteneur pour les erreurs de chargement -->
    <div id="asset-errors" style="display:none; color:red; margin-top:10px; font-family:monospace;"></div>
    
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
            <h3>Erreurs de chargement:</h3>
            <ul id="error-list"></ul>
            <script>
              document.getElementById("asset-errors").style.display = "block";
              document.getElementById("error-list").innerHTML = document.getElementById("asset-errors").innerHTML || "<li>Aucune erreur détectée</li>";
            </script>
            <h3>Diagnostics recommandés:</h3>
            <ul>
              <li><a href="/assets-check.php" style="color:#0066cc;">Page de diagnostic des assets</a></li>
              <li><a href="/api/file-check.php" style="color:#0066cc;">Vérification détaillée des fichiers</a></li>
            </ul>
          </div>
        `;
      }
    }, 5000);
    </script>
</body>
</html>';

// Journaliser la fin de la requête
assetLog("HTML généré et envoyé au navigateur");
assetLog("=== FIN DE REQUÊTE ===\n");
?>
