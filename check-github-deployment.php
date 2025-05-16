
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification du déploiement GitHub</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; margin-bottom: 10px; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; margin-bottom: 10px; }
        .warning { color: orange; background-color: #fffbf0; padding: 10px; border-left: 3px solid orange; margin-bottom: 10px; }
        .info { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        button, .button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; text-decoration: none; display: inline-block; }
        .button.secondary { background-color: #2196F3; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Vérification du déploiement GitHub</h1>
    
    <div class="info">
        <p>Cet outil analyse les problèmes courants de déploiement GitHub vers Infomaniak et propose des solutions.</p>
    </div>
    
    <?php
    // Fonction pour vérifier l'existence de fichiers
    function checkFiles($files) {
        $results = [];
        foreach ($files as $file => $description) {
            $results[$file] = [
                'exists' => file_exists($file),
                'size' => file_exists($file) ? filesize($file) : 0,
                'description' => $description
            ];
        }
        return $results;
    }
    
    // Fichiers critiques à vérifier
    $criticalFiles = [
        './assets/gptengineer.js' => 'Fichier JavaScript de fallback',
        './.github/workflows/deploy.yml' => 'Workflow GitHub principal',
        './.github/workflows/deploy-unified.yml' => 'Workflow GitHub unifié'
    ];
    
    $fileResults = checkFiles($criticalFiles);
    
    // Afficher les résultats
    echo "<h2>État des fichiers critiques</h2>";
    echo "<table>";
    echo "<tr><th>Fichier</th><th>Description</th><th>Status</th><th>Taille</th></tr>";
    
    foreach ($fileResults as $file => $result) {
        $status = $result['exists'] ? 
            "<span style='color:green'>Présent</span>" : 
            "<span style='color:red'>Manquant</span>";
        $size = $result['exists'] ? $result['size'] . ' octets' : 'N/A';
        
        echo "<tr>";
        echo "<td>$file</td>";
        echo "<td>{$result['description']}</td>";
        echo "<td>$status</td>";
        echo "<td>$size</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Vérifier les workflows GitHub
    $hasWorkflow = $fileResults['./.github/workflows/deploy.yml']['exists'] || 
                  $fileResults['./.github/workflows/deploy-unified.yml']['exists'];
    
    if (!$hasWorkflow) {
        echo "<div class='error'><strong>Problème détecté:</strong> Aucun workflow GitHub trouvé.</div>";
        echo "<p>Solution proposée: créer un workflow GitHub de base.</p>";
        
        if (isset($_POST['create_workflow'])) {
            $workflowsDir = './.github/workflows';
            if (!is_dir($workflowsDir)) {
                mkdir($workflowsDir, 0755, true);
            }
            
            $workflowContent = <<<EOT
name: Deploy to Infomaniak

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
      
    - name: Prepare deployment
      run: |
        mkdir -p deploy/assets
        
        # Copier les fichiers principaux
        cp index.html deploy/
        cp .htaccess deploy/ || echo "No .htaccess found"
        cp -r assets/* deploy/assets/ || echo "No assets folder"
        
        # Vérifier et créer le fichier de fallback
        if [ ! -f "assets/gptengineer.js" ]; then
          mkdir -p deploy/assets
          echo '// Fallback local pour gptengineer.js
console.log("Utilisation du fallback local pour gptengineer.js depuis le serveur Infomaniak");
(function() {
  window.addEventListener("DOMContentLoaded", function() {
    console.log("GPT Engineer fallback script loaded from Infomaniak server");
  });
})();' > deploy/assets/gptengineer.js
          echo "Created fallback file"
        else
          cp assets/gptengineer.js deploy/assets/gptengineer.js || echo "Could not copy fallback file"
        fi
        
        # Liste des fichiers à déployer
        ls -la deploy/
        ls -la deploy/assets/ || echo "No assets directory"
    
    - name: Deploy via FTP
      uses: SamKirkland/FTP-Deploy-Action@v4
      with:
        server: \${{ secrets.FTP_SERVER }}
        username: \${{ secrets.FTP_USERNAME }}
        password: \${{ secrets.FTP_PASSWORD }}
        local-dir: ./deploy/
        dangerous-clean-slate: false
EOT;
            
            file_put_contents('./.github/workflows/deploy.yml', $workflowContent);
            echo "<div class='success'>Workflow GitHub créé avec succès!</div>";
        } else {
            echo "<form method='post'>";
            echo "<button type='submit' name='create_workflow'>Créer un workflow GitHub</button>";
            echo "</form>";
        }
    }
    
    // Vérifier le fichier de fallback
    if (!$fileResults['./assets/gptengineer.js']['exists']) {
        echo "<div class='warning'><strong>Problème détecté:</strong> Fichier de fallback manquant.</div>";
        echo "<p>Solution proposée: créer le fichier de fallback directement.</p>";
        
        if (isset($_POST['create_fallback'])) {
            $dir = './assets';
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            
            $fallbackContent = <<<EOT
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
EOT;
            
            if (file_put_contents('./assets/gptengineer.js', $fallbackContent)) {
                echo "<div class='success'>Fichier de fallback créé avec succès!</div>";
            } else {
                echo "<div class='error'>Impossible de créer le fichier de fallback.</div>";
            }
        } else {
            echo "<form method='post'>";
            echo "<button type='submit' name='create_fallback'>Créer le fichier de fallback</button>";
            echo "</form>";
        }
    }
    
    // Vérifier index.html
    if (file_exists('./index.html')) {
        $indexContent = file_get_contents('./index.html');
        $hasGptScript = strpos($indexContent, 'cdn.gpteng.co/gptengineer.js') !== false;
        $hasFallback = strpos($indexContent, 'assets/gptengineer.js') !== false;
        
        if ($hasGptScript && !$hasFallback) {
            echo "<div class='warning'><strong>Problème détecté:</strong> Script CDN trouvé mais pas de fallback local dans index.html.</div>";
            echo "<p>Solution proposée: configurer le fallback.</p>";
            echo "<form method='post' action='update-script-references.php'>";
            echo "<input type='hidden' name='external_url' value='https://cdn.gpteng.co/gptengineer.js'>";
            echo "<input type='hidden' name='local_path' value='/assets/gptengineer.js'>";
            echo "<button type='submit'>Configurer le fallback</button>";
            echo "</form>";
        } elseif ($hasFallback) {
            echo "<div class='success'>Fallback configuré correctement dans index.html.</div>";
        }
    }
    ?>
    
    <h2>Actions recommandées</h2>
    <p>Voici les actions recommandées pour résoudre les problèmes de déploiement:</p>
    
    <ol>
        <li>Utiliser les outils suivants pour créer/vérifier les fichiers directement sur le serveur:
            <ul>
                <li><a href="create-fallback-assets.php" class="button">Créer les fichiers de fallback</a></li>
                <li><a href="test-assets-routes.php" class="button secondary">Tester les routes</a></li>
            </ul>
        </li>
        <li>Si le workflow GitHub ne fonctionne pas correctement:
            <ul>
                <li>Vérifier que les secrets FTP_SERVER, FTP_USERNAME et FTP_PASSWORD sont configurés</li>
                <li>Déclencher manuellement le workflow depuis GitHub</li>
                <li>Vérifier les logs de déploiement sur GitHub Actions</li>
            </ul>
        </li>
    </ol>
    
    <div class="info" style="margin-top: 20px;">
        <h3>Pourquoi utiliser la méthode manuelle?</h3>
        <p>Même si GitHub indique un déploiement "vert" (réussi), il peut y avoir des problèmes de permissions ou de configuration qui empêchent certains fichiers d'être correctement copiés. La méthode manuelle permet de contourner ces problèmes en créant directement les fichiers sur le serveur.</p>
    </div>
</body>
</html>
