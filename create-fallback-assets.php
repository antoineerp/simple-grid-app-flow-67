
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Création des fichiers de fallback</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; margin-bottom: 10px; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; margin-bottom: 10px; }
        .info { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>Création des fichiers de fallback</h1>
    
    <div class="info">
        <p>Cet outil va créer les fichiers de fallback nécessaires directement sur votre serveur Infomaniak sans passer par GitHub.</p>
    </div>
    
    <?php
    // Définir les fichiers de fallback à créer
    $fallbackFiles = [
        './assets/gptengineer.js' => [
            'content' => <<<EOT
// Fallback local pour gptengineer.js
console.log('Utilisation du fallback local pour gptengineer.js depuis le serveur Infomaniak');

// Simulation minimale des fonctionnalités
(function() {
  window.addEventListener('DOMContentLoaded', function() {
    console.log('GPT Engineer fallback script loaded from Infomaniak server');
    // Cette version locale ne fournit pas toutes les fonctionnalités
    // mais permet au site de fonctionner sans erreur 404
  });
})();
EOT,
            'description' => 'Fallback pour gptengineer.js'
        ]
    ];
    
    // Action de création
    if (isset($_POST['create_files'])) {
        foreach ($fallbackFiles as $path => $fileInfo) {
            $dir = dirname($path);
            
            // Créer le dossier si nécessaire
            if (!file_exists($dir)) {
                if (!mkdir($dir, 0755, true)) {
                    echo "<div class='error'>Impossible de créer le dossier: $dir</div>";
                    continue;
                }
                echo "<div class='success'>Dossier créé: $dir</div>";
            }
            
            // Créer le fichier
            if (file_put_contents($path, $fileInfo['content'])) {
                echo "<div class='success'>Fichier créé avec succès: $path</div>";
            } else {
                echo "<div class='error'>Impossible de créer le fichier: $path</div>";
            }
        }
    }
    
    // Afficher les fichiers qui seront créés
    echo "<h2>Fichiers à créer:</h2>";
    echo "<ul>";
    foreach ($fallbackFiles as $path => $fileInfo) {
        $exists = file_exists($path) ? " <span style='color:green'>(Existe déjà)</span>" : " <span style='color:orange'>(À créer)</span>";
        echo "<li>$path - {$fileInfo['description']}$exists</li>";
    }
    echo "</ul>";
    
    // Formulaire pour la création
    echo "<form method='post'>";
    echo "<button type='submit' name='create_files'>Créer les fichiers de fallback</button>";
    echo "</form>";
    
    // Vérifier index.html pour le script gptengineer.js
    if (file_exists('./index.html')) {
        $indexContent = file_get_contents('./index.html');
        $hasGptScript = strpos($indexContent, 'cdn.gpteng.co/gptengineer.js') !== false;
        $hasFallback = strpos($indexContent, 'assets/gptengineer.js') !== false;
        
        echo "<h2>Analyse de index.html:</h2>";
        if ($hasGptScript) {
            echo "<div class='success'>Script gptengineer.js trouvé dans index.html</div>";
        } else {
            echo "<div class='error'>Script gptengineer.js non trouvé dans index.html</div>";
        }
        
        if ($hasFallback) {
            echo "<div class='success'>Fallback local trouvé dans index.html</div>";
        } else {
            echo "<div class='error'>Fallback local non trouvé dans index.html</div>";
            echo "<p>Utilisez l'outil ci-dessous pour configurer le fallback dans index.html:</p>";
            echo "<form method='post' action='update-script-references.php'>";
            echo "<input type='hidden' name='external_url' value='https://cdn.gpteng.co/gptengineer.js'>";
            echo "<input type='hidden' name='local_path' value='/assets/gptengineer.js'>";
            echo "<button type='submit'>Configurer le fallback dans index.html</button>";
            echo "</form>";
        }
    } else {
        echo "<div class='error'>Fichier index.html introuvable</div>";
    }
    ?>
    
    <div class="info" style="margin-top: 20px;">
        <h3>Que fait cet outil?</h3>
        <p>Il crée directement les fichiers sur votre serveur sans passer par GitHub. C'est utile quand:</p>
        <ul>
            <li>Le déploiement GitHub ne fonctionne pas correctement</li>
            <li>Vous avez besoin d'ajouter rapidement des fichiers sur le serveur</li>
            <li>Les permissions empêchent le workflow GitHub de créer certains fichiers</li>
        </ul>
    </div>
    
    <p><a href="test-assets-routes.php">Retour aux tests des routes</a></p>
</body>
</html>
