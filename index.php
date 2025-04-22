
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

// Vérifier l'existence du dossier dist/assets
$assetsDir = __DIR__ . '/dist/assets';
if (!is_dir($assetsDir)) {
    assetLog("ERREUR CRITIQUE: Le dossier dist/assets n'existe pas!");
    assetLog("Document root: " . __DIR__);
    // Lister les répertoires à la racine pour diagnostic
    $rootDirs = scandir(__DIR__);
    assetLog("Contenu de la racine: " . implode(", ", $rootDirs));
}

// Détection des fichiers CSS et JS (sans hachage)
assetLog("Vérification des fichiers index.css et index.js");
$cssFile = "index.css";
$jsFile = "index.js";

$cssExists = file_exists("$assetsDir/$cssFile");
$jsExists = file_exists("$assetsDir/$jsFile");

assetLog("index.css existe: " . ($cssExists ? "OUI" : "NON"));
assetLog("index.js existe: " . ($jsExists ? "OUI" : "NON"));

// Servir le contenu HTML
echo '<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FormaCert</title>
    <link rel="icon" href="/lovable-uploads/formacert-logo.png" type="image/png">
    
    <!-- CSS avec chemins sans hachage -->
    <link rel="stylesheet" href="/dist/assets/index.css">
    
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
    
    <!-- Script principal sans hachage -->
    <script type="module" src="/dist/assets/index.js"></script>
    
    <!-- Message d\'erreur après 5 secondes si l\'application n\'a pas chargé -->
    <script>
    setTimeout(function() {
      if (document.getElementById("root").childElementCount === 0) {
        document.getElementById("root").innerHTML = `
          <div style="max-width:800px; margin:50px auto; padding:20px; font-family:sans-serif; line-height:1.5; color:#333; background:#f9f9f9; border:1px solid #ddd; border-radius:8px;">
            <h1 style="color:#d33;">Erreur de chargement de l\'application</h1>
            <p>L\'application n\'a pas pu être chargée correctement. Cela peut être dû à un problème avec les fichiers statiques.</p>
            <h3>Fichiers détectés:</h3>
            <p>CSS: ' . htmlspecialchars($cssFile) . ' (Existe: ' . ($cssExists ? 'Oui' : 'Non') . ')</p>
            <p>JS: ' . htmlspecialchars($jsFile) . ' (Existe: ' . ($jsExists ? 'Oui' : 'Non') . ')</p>
            <h3>Erreurs de chargement:</h3>
            <ul id="error-list"></ul>
            <script>
              document.getElementById("asset-errors").style.display = "block";
              document.getElementById("error-list").innerHTML = document.getElementById("asset-errors").innerHTML || "<li>Aucune erreur détectée</li>";
            </script>
            <h3>Diagnostics recommandés:</h3>
            <ul>
              <li><a href="/debug-assets.php" style="color:#0066cc;">Diagnostic détaillé des assets</a></li>
              <li><a href="/assets-check.php" style="color:#0066cc;">Vérification des assets</a></li>
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
