
<?php
// Éviter l'erreur "headers already sent"
ob_start();
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification des problèmes de déploiement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; padding: 10px; background-color: #f0fff0; border-left: 4px solid green; }
        .error { color: red; padding: 10px; background-color: #fff0f0; border-left: 4px solid red; }
        .warning { color: orange; padding: 10px; background-color: #fffaf0; border-left: 4px solid orange; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Diagnostic des problèmes de déploiement</h1>
        
        <div class="card">
            <h2>Vérification de la structure des fichiers</h2>
            
            <?php
            // Vérifier l'existence des dossiers principaux
            $dirs_to_check = ['dist', 'assets', 'api', 'public'];
            $missing_dirs = [];
            
            foreach ($dirs_to_check as $dir) {
                if (!is_dir($dir)) {
                    $missing_dirs[] = $dir;
                }
            }
            
            if (!empty($missing_dirs)) {
                echo "<div class='error'><strong>Dossiers manquants:</strong> " . implode(', ', $missing_dirs) . "</div>";
            } else {
                echo "<div class='success'>Tous les dossiers principaux existent.</div>";
            }
            
            // Vérifier le contenu du dossier dist
            if (is_dir('dist')) {
                $dist_files = scandir('dist');
                $dist_files = array_diff($dist_files, array('.', '..'));
                
                if (count($dist_files) > 0) {
                    echo "<div class='success'>Le dossier dist contient des fichiers (" . count($dist_files) . ").</div>";
                    echo "<p>Premiers fichiers dans dist:</p><ul>";
                    $i = 0;
                    foreach ($dist_files as $file) {
                        echo "<li>$file</li>";
                        $i++;
                        if ($i >= 5) break; // Limiter à 5 fichiers
                    }
                    echo "</ul>";
                } else {
                    echo "<div class='error'>Le dossier dist est vide.</div>";
                }
            }
            
            // Vérifier le fichier de workflow GitHub
            $workflow_file = './.github/workflows/deploy.yml';
            $simple_workflow_file = './.github/workflows/deploy-simple.yml';
            
            if (file_exists($workflow_file)) {
                echo "<div class='success'>Fichier de workflow trouvé: deploy.yml</div>";
                $workflow_content = file_get_contents($workflow_file);
                
                if (strpos($workflow_content, 'dist') !== false) {
                    echo "<div class='success'>Le workflow semble référencer le dossier 'dist'.</div>";
                } else {
                    echo "<div class='warning'>Le workflow ne semble pas référencer explicitement le dossier 'dist'.</div>";
                }
                
            } else if (file_exists($simple_workflow_file)) {
                echo "<div class='success'>Fichier de workflow trouvé: deploy-simple.yml</div>";
                $workflow_content = file_get_contents($simple_workflow_file);
                
                if (strpos($workflow_content, 'dist') !== false) {
                    echo "<div class='success'>Le workflow simple semble référencer le dossier 'dist'.</div>";
                } else {
                    echo "<div class='warning'>Le workflow simple ne semble pas référencer explicitement le dossier 'dist'.</div>";
                }
            } else {
                echo "<div class='error'>Aucun fichier de workflow GitHub trouvé.</div>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Commandes manuelles de déploiement</h2>
            <p>Si le workflow GitHub ne fonctionne pas, voici les commandes manuelles à exécuter dans votre terminal:</p>
            
            <pre>
# Construction de l'application
npm run build

# Pousser les changements vers GitHub
git add .
git commit -m "Update build files"
git push origin main

# OU utiliser le script de déploiement manuel
./deploy-manual.sh
            </pre>
            
            <p><strong>Note:</strong> Si vous modifiez directement des fichiers sur le serveur via SSH, ces modifications seront écrasées lors du prochain déploiement via GitHub.</p>
        </div>
        
        <div class="card">
            <h2>Correction du workflow GitHub</h2>
            <p>Nous avons mis à jour le workflow pour inclure explicitement le dossier <code>dist</code> dans le déploiement.</p>
            <p>Après avoir vérifié le problème avec ce diagnostic, merci de:</p>
            <ol>
                <li>Faire un commit et push pour appliquer les modifications du workflow</li>
                <li>Déclencher manuellement le workflow de déploiement dans GitHub Actions</li>
                <li>Vérifier que les fichiers sont bien déployés</li>
            </ol>
        </div>
    </div>
</body>
</html>
<?php ob_end_flush(); ?>
