
<?php
// Ce script crée les répertoires manquants pour éviter les erreurs FTP 550
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Création des répertoires manquants</title>
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
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Création des répertoires manquants</h1>
        
        <div class="card">
            <h2>Diagnostic des répertoires</h2>
            
            <?php
            // Liste des répertoires à vérifier/créer
            $directories = [
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
            
            // Vérifier et créer les répertoires
            foreach ($directories as $dir) {
                if (!file_exists($dir)) {
                    try {
                        if (mkdir($dir, 0755, true)) {
                            $created[] = $dir;
                        } else {
                            $errors[] = $dir;
                        }
                    } catch (Exception $e) {
                        $errors[] = "$dir (Erreur: " . $e->getMessage() . ")";
                    }
                } else {
                    $already_exists[] = $dir;
                }
            }
            
            // Afficher les résultats
            if (!empty($created)) {
                echo "<div class='success'><strong>Répertoires créés avec succès:</strong><ul>";
                foreach ($created as $dir) {
                    echo "<li>$dir</li>";
                }
                echo "</ul></div>";
            }
            
            if (!empty($already_exists)) {
                echo "<p><strong>Répertoires déjà existants:</strong><ul>";
                foreach ($already_exists as $dir) {
                    echo "<li>$dir</li>";
                }
                echo "</ul></p>";
            }
            
            if (!empty($errors)) {
                echo "<div class='error'><strong>Erreurs lors de la création:</strong><ul>";
                foreach ($errors as $dir) {
                    echo "<li>$dir</li>";
                }
                echo "</ul></div>";
            }
            ?>
            
            <h3>Vérification des permissions</h3>
            <?php
            // Vérifier les permissions
            if (is_writable('./api')) {
                echo "<div class='success'>Le répertoire /api est accessible en écriture.</div>";
            } else {
                echo "<div class='error'>Le répertoire /api n'est PAS accessible en écriture. Cela peut causer des problèmes lors du déploiement.</div>";
            }
            
            // Créer un fichier test dans le répertoire documentation
            if (in_array('./api/documentation', $created) || in_array('./api/documentation', $already_exists)) {
                $test_file = './api/documentation/README.md';
                $content = "# Documentation API\n\nCe dossier contient la documentation de l'API.";
                
                if (file_put_contents($test_file, $content)) {
                    echo "<div class='success'>Fichier test créé avec succès dans le répertoire documentation.</div>";
                } else {
                    echo "<div class='error'>Impossible de créer un fichier test dans le répertoire documentation.</div>";
                }
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Guide de résolution Git</h2>
            <p>Pour résoudre votre problème de push Git:</p>
            <ol>
                <li>Exécutez <code>git pull</code> pour récupérer les dernières modifications du dépôt distant</li>
                <li>Résolvez les conflits s'il y en a</li>
                <li>Faites un nouveau commit si nécessaire</li>
                <li>Exécutez <code>git push</code> à nouveau</li>
            </ol>
            
            <p>Commandes pour récupérer et pousser les modifications:</p>
            <pre>
git pull
# Résolvez les conflits si nécessaire
git add .
git commit -m "Résolution des conflits et ajout du dossier dist"
git push origin main
            </pre>
        </div>
        
        <div class="card">
            <h2>Prochaines étapes</h2>
            <p>Une fois les répertoires créés et le code poussé sur GitHub:</p>
            <ol>
                <li>Déclenchez manuellement le workflow GitHub Actions pour lancer le déploiement</li>
                <li>Vérifiez le journal du workflow pour vous assurer qu'il n'y a pas d'erreurs</li>
                <li>Testez votre application pour confirmer que tout fonctionne correctement</li>
            </ol>
            <p><a href="check-deployment-issues.php" class="button">Vérifier l'état du déploiement</a></p>
        </div>
    </div>
</body>
</html>
