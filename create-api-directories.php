
<?php
// Script pour créer les répertoires API manquants sur le serveur
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Création des répertoires API manquants</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; padding: 10px; background-color: #f0fff0; border-left: 4px solid green; }
        .error { color: red; padding: 10px; background-color: #fff0f0; border-left: 4px solid red; }
        .button { 
            background-color: #4CAF50; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 16px;
            margin-top: 10px;
            display: inline-block;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Création des répertoires API manquants</h1>
        
        <div class="card">
            <h2>Création des répertoires</h2>
            
            <?php
            // Listes des répertoires à créer
            $directories = [
                './api',
                './api/documentation',
                './api/config',
                './api/controllers',
                './api/models',
                './api/middleware',
                './api/operations',
                './api/utils'
            ];
            
            $created = [];
            $already_exists = [];
            $errors = [];
            
            // Créer chaque répertoire s'il n'existe pas
            foreach ($directories as $dir) {
                if (!file_exists($dir)) {
                    if (mkdir($dir, 0755, true)) {
                        $created[] = $dir;
                    } else {
                        $errors[] = $dir;
                    }
                } else {
                    $already_exists[] = $dir;
                }
            }
            
            // Rapport sur les répertoires créés
            if (!empty($created)) {
                echo "<div class='success'>";
                echo "<strong>Répertoires créés avec succès :</strong>";
                echo "<ul>";
                foreach ($created as $dir) {
                    echo "<li>$dir</li>";
                }
                echo "</ul>";
                echo "</div>";
            }
            
            // Rapport sur les répertoires existants
            if (!empty($already_exists)) {
                echo "<p><strong>Répertoires déjà existants :</strong>";
                echo "<ul>";
                foreach ($already_exists as $dir) {
                    echo "<li>$dir</li>";
                }
                echo "</ul>";
                echo "</p>";
            }
            
            // Rapport sur les erreurs
            if (!empty($errors)) {
                echo "<div class='error'>";
                echo "<strong>Erreurs lors de la création des répertoires :</strong>";
                echo "<ul>";
                foreach ($errors as $dir) {
                    echo "<li>$dir</li>";
                }
                echo "</ul>";
                echo "<p>Vérifiez les permissions d'écriture sur le serveur.</p>";
                echo "</div>";
            }
            
            // Créer un fichier README dans le répertoire documentation
            if (in_array('./api/documentation', $created) || in_array('./api/documentation', $already_exists)) {
                $readme_file = './api/documentation/README.md';
                $content = "# Documentation API\n\nCe dossier contient la documentation de l'API.";
                
                if (file_put_contents($readme_file, $content)) {
                    echo "<div class='success'>Fichier README.md créé dans le dossier documentation.</div>";
                } else {
                    echo "<div class='error'>Impossible de créer le fichier README.md dans le dossier documentation.</div>";
                }
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Prochaines étapes</h2>
            <p>Maintenant que les répertoires sont créés, vous pouvez :</p>
            <ol>
                <li>Relancer le déploiement GitHub Actions</li>
                <li>Si le déploiement échoue encore, vérifiez les permissions sur le serveur</li>
            </ol>
            <p>
                <a href="check-deployment-issues.php" class="button">Vérifier les problèmes de déploiement</a>
                <a href="deploy-simple.php" class="button">Déploiement manuel</a>
            </p>
        </div>
    </div>
</body>
</html>
