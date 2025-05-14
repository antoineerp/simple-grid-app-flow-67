
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Réparer le workflow GitHub</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 1000px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { 
            background-color: #4CAF50; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 16px; 
            text-decoration: none;
            display: inline-block;
        }
        .button:hover { background-color: #45a049; }
        .back { background-color: #607D8B; }
        .success { color: green; padding: 10px; background-color: #f0fff0; border-left: 4px solid green; }
        .error { color: red; padding: 10px; background-color: #fff0f0; border-left: 4px solid red; }
        .warning { color: orange; padding: 10px; background-color: #fffaf0; border-left: 4px solid orange; }
        .info { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #17a2b8; margin: 10px 0; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; }
        textarea {
            width: 100%;
            height: 300px;
            padding: 8px;
            box-sizing: border-box;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
        }
        .form-group { margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Réparation du workflow GitHub Actions</h1>
        
        <?php
        $workflow_file = './.github/workflows/deploy.yml';
        $backup_file = './.github/workflows/deploy.yml.backup.'.time();
        $success_message = '';
        $error_message = '';
        
        // Vérifier si le fichier de workflow existe
        if (!file_exists($workflow_file)) {
            $error_message = "Fichier de workflow non trouvé: $workflow_file";
        }
        
        // Traiter la soumission du formulaire
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_workflow'])) {
            if (!empty($_POST['workflow_content'])) {
                // Créer une sauvegarde du fichier original
                if (file_exists($workflow_file)) {
                    if (!copy($workflow_file, $backup_file)) {
                        $error_message = "Impossible de créer une sauvegarde du fichier de workflow.";
                    } else {
                        // Écrire le nouveau contenu
                        if (file_put_contents($workflow_file, $_POST['workflow_content'])) {
                            $success_message = "Le fichier de workflow a été mis à jour avec succès! Une sauvegarde a été créée: " . basename($backup_file);
                        } else {
                            $error_message = "Impossible d'écrire dans le fichier de workflow.";
                        }
                    }
                } else {
                    $error_message = "Le fichier de workflow n'existe pas.";
                }
            } else {
                $error_message = "Le contenu du workflow ne peut pas être vide.";
            }
        }
        
        // Récupérer le contenu du fichier de workflow
        $workflow_content = '';
        if (file_exists($workflow_file)) {
            $workflow_content = file_get_contents($workflow_file);
        }
        
        // Corriger automatiquement le problème connu d'EOL
        if (isset($_POST['auto_fix'])) {
            $lines = explode("\n", $workflow_content);
            $fixed_lines = [];
            $in_prepare_deployment = false;
            $in_cat_block = false;
            $eol_marker = '';
            
            foreach ($lines as $line) {
                // Détecter si nous sommes dans la section "Prepare deployment directory"
                if (strpos($line, "name: Prepare deployment directory") !== false) {
                    $in_prepare_deployment = true;
                }
                
                // Détecter le début d'un bloc cat
                if ($in_prepare_deployment && !$in_cat_block && strpos($line, "cat > deploy/api/config/env.php <<") !== false) {
                    $in_cat_block = true;
                    
                    // Extraire le marqueur EOL
                    preg_match('/<<\s*[\'"]?(EOL|EOF)[\'"]?/', $line, $matches);
                    if (!empty($matches[0])) {
                        $eol_marker = trim(str_replace(['<<', "'", '"'], '', $matches[0]));
                    }
                    
                    // Remplacer par une approche plus fiable
                    $fixed_lines[] = "        # Créer config/env.php avec les variables d'environnement";
                    $fixed_lines[] = "        mkdir -p deploy/api/config";
                    $fixed_lines[] = "        echo '<?php";
                    $fixed_lines[] = "// Configuration des variables d'environnement pour Infomaniak";
                    $fixed_lines[] = "define(\"DB_HOST\", \"p71x6d.myd.infomaniak.com\");";
                    $fixed_lines[] = "define(\"DB_NAME\", \"p71x6d_richard\");";
                    $fixed_lines[] = "define(\"DB_USER\", \"p71x6d_richard\");";
                    $fixed_lines[] = "define(\"DB_PASS\", \"Trottinette43!\");";
                    $fixed_lines[] = "define(\"API_BASE_URL\", \"/api\");";
                    $fixed_lines[] = "define(\"APP_ENV\", \"production\");";
                    $fixed_lines[] = "// Fonction d'aide pour récupérer les variables d'environnement";
                    $fixed_lines[] = "function get_env($key, $default = null) {";
                    $fixed_lines[] = "    $const_name = strtoupper($key);";
                    $fixed_lines[] = "    if (defined($const_name)) {";
                    $fixed_lines[] = "        return constant($const_name);";
                    $fixed_lines[] = "    }";
                    $fixed_lines[] = "    return $default;";
                    $fixed_lines[] = "}";
                    $fixed_lines[] = "?>' > deploy/api/config/env.php";
                    continue;
                }
                
                // Ignorer les lignes dans le bloc cat jusqu'à ce qu'on trouve le marqueur EOL
                if ($in_cat_block) {
                    if (trim($line) === $eol_marker) {
                        $in_cat_block = false;
                        continue;
                    }
                    continue;
                }
                
                // Ignorer la ligne qui imprime le message de confirmation du fichier env.php
                if ($in_prepare_deployment && !$in_cat_block && trim($line) === "echo \"Fichier env.php créé avec p71x6d_richard\"") {
                    continue;
                }
                
                $fixed_lines[] = $line;
            }
            
            $workflow_content = implode("\n", $fixed_lines);
            $success_message = "Le workflow a été corrigé automatiquement. Vérifiez et enregistrez les modifications.";
        }
        ?>
        
        <div class="card">
            <h2>Modifier le fichier de workflow GitHub Actions</h2>
            
            <?php if ($success_message): ?>
            <div class="success"><?php echo $success_message; ?></div>
            <?php endif; ?>
            
            <?php if ($error_message): ?>
            <div class="error"><?php echo $error_message; ?></div>
            <?php endif; ?>
            
            <?php if (!file_exists($workflow_file)): ?>
            <div class="warning">
                <p>Le fichier de workflow GitHub <code><?php echo htmlspecialchars($workflow_file); ?></code> n'a pas été trouvé.</p>
                <p>Assurez-vous que le fichier existe au bon emplacement.</p>
            </div>
            <?php else: ?>
            <form method="post">
                <div class="form-group">
                    <label for="workflow_content">Contenu du fichier de workflow:</label>
                    <textarea id="workflow_content" name="workflow_content"><?php echo htmlspecialchars($workflow_content); ?></textarea>
                </div>
                
                <div class="form-group">
                    <button type="submit" name="update_workflow" class="button">Enregistrer les modifications</button>
                    <button type="submit" name="auto_fix" class="button">Correction automatique</button>
                    <a href="yaml-validator.php" class="button">Valider la syntaxe YAML</a>
                </div>
            </form>
            
            <div class="info">
                <p><strong>Conseil:</strong> Si vous rencontrez des problèmes avec la syntaxe YAML, essayez l'une des solutions suivantes:</p>
                <ol>
                    <li>Utilisez le bouton "Correction automatique" pour remplacer les blocks <code>cat &lt;&lt; EOL</code> par des commandes <code>echo</code> plus simples.</li>
                    <li>Assurez-vous que l'indentation est cohérente (2 espaces par niveau).</li>
                    <li>Vérifiez que les caractères spéciaux sont correctement échappés.</li>
                </ol>
            </div>
            <?php endif; ?>
        </div>
        
        <div class="card">
            <h2>Exemple de workflow GitHub corrigé</h2>
            
            <p>Voici un exemple de la section problématique du workflow GitHub corrigée:</p>
            
            <pre>
    - name: Prepare deployment directory
      run: |
        # Création des dossiers nécessaires
        mkdir -p deploy/assets
        mkdir -p deploy/api
        mkdir -p deploy/api/config
        
        # Autres commandes...
        
        # Créer config/env.php avec les variables d'environnement
        mkdir -p deploy/api/config
        echo '<?php
// Configuration des variables d'environnement pour Infomaniak
define("DB_HOST", "p71x6d.myd.infomaniak.com");
define("DB_NAME", "p71x6d_richard");
define("DB_USER", "p71x6d_richard");
define("DB_PASS", "Trottinette43!");
define("API_BASE_URL", "/api");
define("APP_ENV", "production");
// Fonction d'aide pour récupérer les variables d'environnement
function get_env($key, $default = null) {
    $const_name = strtoupper($key);
    if (defined($const_name)) {
        return constant($const_name);
    }
    return $default;
}
?>' > deploy/api/config/env.php
            </pre>
        </div>
        
        <a href="deploy-on-infomaniak.php" class="button back">Retour à la page de déploiement</a>
    </div>
</body>
</html>
