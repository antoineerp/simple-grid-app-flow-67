
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Déploiement sur Infomaniak</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2 { color: #334155; }
        .section { margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc; }
        .success { color: #15803d; font-weight: 600; }
        .error { color: #b91c1c; font-weight: 600; }
        .warning { color: #b45309; font-weight: 600; }
        code { background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
        .command { background-color: #1e293b; color: #f8fafc; padding: 12px; border-radius: 6px; overflow-x: auto; }
        .action-button { background-color: #2563eb; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Assistant de Déploiement sur Infomaniak</h1>
    <p>Cet outil aidera à configurer correctement votre application sur l'hébergement Infomaniak.</p>
    
    <div class="section">
        <h2>1. Détection de l'environnement</h2>
        <?php
        // Détecter l'environnement Infomaniak
        $client_path = '/home/clients/df8dceff557ccc0605d45e1581aa661b';
        $sites_path = $client_path . '/sites';
        $domain = 'qualiopi.ch';
        $site_path = "{$sites_path}/{$domain}";
        
        echo "<p>Chemins détectés:</p>";
        echo "<ul>";
        echo "<li>Répertoire client: <code>{$client_path}</code> - " . (is_dir($client_path) ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>') . "</li>";
        echo "<li>Répertoire sites: <code>{$sites_path}</code> - " . (is_dir($sites_path) ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>') . "</li>";
        echo "<li>Répertoire du site: <code>{$site_path}</code> - " . (is_dir($site_path) ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>') . "</li>";
        echo "</ul>";
        
        echo "<p>Informations serveur:</p>";
        echo "<ul>";
        echo "<li>Utilisateur courant: <code>" . exec('whoami') . "</code></li>";
        echo "<li>Répertoire courant: <code>" . getcwd() . "</code></li>";
        echo "<li>Document root: <code>" . ($_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible') . "</code></li>";
        echo "</ul>";
        
        // Test de compatibilité entre le chemin courant et celui attendu
        $current_path = getcwd();
        $expected_paths = [
            $site_path,
            $_SERVER['DOCUMENT_ROOT'] ?? '',
            str_replace('/sites/' . $domain, '', $current_path) . '/sites/' . $domain
        ];
        
        $path_match = false;
        foreach ($expected_paths as $path) {
            if ($path && strpos($current_path, $path) !== false) {
                $path_match = true;
                break;
            }
        }
        
        echo "<p>Compatibilité du chemin: " . 
             ($path_match ? 
              '<span class="success">Le chemin actuel semble correspondre à la structure attendue</span>' : 
              '<span class="warning">Le chemin actuel ne correspond pas exactement à la structure attendue</span>') .
             "</p>";
        ?>
    </div>
    
    <div class="section">
        <h2>2. Commandes SSH à utiliser</h2>
        <p>Utilisez ces commandes dans votre session SSH pour diagnostiquer l'application:</p>
        
        <h3>Naviguer vers le répertoire correct</h3>
        <div class="command">
            cd <?php echo $site_path; ?>
        </div>
        
        <h3>Exécuter les scripts de diagnostic</h3>
        <div class="command">
            bash ssh-diagnostic.sh
        </div>
        <div class="command">
            bash diagnose-infomaniak.sh
        </div>
        <div class="command">
            php check-paths.php
        </div>
        
        <h3>Si vous ne trouvez pas les scripts</h3>
        <div class="command">
            find <?php echo $client_path; ?> -name "ssh-diagnostic.sh" -type f
        </div>
        <div class="command">
            find <?php echo $client_path; ?> -name "diagnose-infomaniak.sh" -type f
        </div>
    </div>
    
    <div class="section">
        <h2>3. Vérification des chemins dans la configuration</h2>
        <?php
        // Vérifier les fichiers de configuration
        $config_files = [
            'api/config/env.php' => 'Configuration d\'environnement',
            'api/.user.ini' => 'Configuration PHP pour l\'API',
            '.user.ini' => 'Configuration PHP générale'
        ];
        
        echo "<p>Vérification des fichiers de configuration:</p>";
        echo "<ul>";
        
        foreach ($config_files as $file => $desc) {
            if (file_exists($file)) {
                echo "<li><code>{$file}</code> ({$desc}) - <span class='success'>Existe</span></li>";
                
                // Analyse du contenu pour les chemins
                $content = file_get_contents($file);
                $incorrect_path = false;
                
                // Vérifier si on trouve des références à des chemins incorrects
                if (strpos($content, '/home/customers') !== false) {
                    $incorrect_path = true;
                    echo "<li class='error'>Chemin incorrect trouvé dans {$file}: /home/customers</li>";
                }
                
                if (!$incorrect_path) {
                    echo "<li class='success'>Aucun chemin incorrect détecté dans {$file}</li>";
                }
                
            } else {
                echo "<li><code>{$file}</code> ({$desc}) - <span class='error'>N'existe pas</span></li>";
            }
        }
        
        echo "</ul>";
        ?>
        
        <h3>Action recommandée</h3>
        <p>Si des chemins incorrects ont été détectés, utilisez les commandes suivantes pour les corriger :</p>
        <div class="command">
            # Remplacer tous les chemins incorrects dans les fichiers PHP
            find . -name "*.php" -type f -exec sed -i 's|/home/customers|/home/clients|g' {} \;
            
            # Remplacer dans les fichiers de configuration
            find . -name "*.ini" -type f -exec sed -i 's|/home/customers|/home/clients|g' {} \;
            find . -name "*.json" -type f -exec sed -i 's|/home/customers|/home/clients|g' {} \;
            find . -name "*.sh" -type f -exec sed -i 's|/home/customers|/home/clients|g' {} \;
        </div>
    </div>
    
    <div class="section">
        <h2>4. Mise à jour des scripts de diagnostic</h2>
        <?php
        // Vérifier si on doit mettre à jour les scripts de diagnostic
        $scripts_to_update = [
            'ssh-diagnostic.sh' => "# Script de diagnostic amélioré pour exécution via SSH\n\n(...)",
            'diagnose-infomaniak.sh' => "# Script de diagnostic spécifique pour l'hébergement Infomaniak\n\n(...)",
            'find-paths.sh' => "# Script pour trouver les chemins importants sur Infomaniak\n\n(...)"
        ];
        
        echo "<p>Vérification des scripts de diagnostic:</p>";
        echo "<ul>";
        
        foreach ($scripts_to_update as $script => $desc) {
            if (file_exists($script)) {
                $content = file_get_contents($script);
                if (strpos($content, '/home/customers') !== false) {
                    echo "<li><code>{$script}</code> - <span class='warning'>Contient des références à corriger</span></li>";
                } else if (strpos($script, 'ssh-diagnostic.sh') !== false && !strpos($content, 'BASE_PATH=')) {
                    echo "<li><code>{$script}</code> - <span class='warning'>Ne contient pas de définition de BASE_PATH</span></li>";
                } else {
                    echo "<li><code>{$script}</code> - <span class='success'>Aucune correction nécessaire</span></li>";
                }
            } else {
                echo "<li><code>{$script}</code> - <span class='error'>N'existe pas</span></li>";
            }
        }
        
        echo "</ul>";
        ?>
        
        <form method="post" action="">
            <input type="hidden" name="update_scripts" value="1">
            <button type="submit" class="action-button">Mettre à jour les scripts de diagnostic</button>
        </form>
        
        <?php
        // Traiter la demande de mise à jour des scripts
        if (isset($_POST['update_scripts'])) {
            echo "<h3>Résultats de la mise à jour:</h3>";
            echo "<ul>";
            
            // Mettre à jour find-paths.sh
            if (file_exists('find-paths.sh')) {
                $find_paths_content = file_get_contents('find-paths.sh');
                $updated_find_paths = str_replace('/home/customers', '/home/clients', $find_paths_content);
                if ($find_paths_content !== $updated_find_paths) {
                    file_put_contents('find-paths.sh', $updated_find_paths);
                    echo "<li><code>find-paths.sh</code> - <span class='success'>Mise à jour effectuée</span></li>";
                } else {
                    echo "<li><code>find-paths.sh</code> - <span class='success'>Aucune mise à jour nécessaire</span></li>";
                }
            }
            
            // Mettre à jour ssh-diagnostic.sh
            if (file_exists('ssh-diagnostic.sh')) {
                $diagnostic_content = file_get_contents('ssh-diagnostic.sh');
                
                // Corriger les chemins /home/customers si présents
                $updated_diagnostic = str_replace('/home/customers', '/home/clients', $diagnostic_content);
                
                // Ajouter BASE_PATH si non présent
                if (strpos($updated_diagnostic, 'BASE_PATH=') === false) {
                    $base_path_code = "# Définir le chemin de base correct pour Infomaniak\nBASE_PATH=\"/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch\"\necho \"Utilisation du chemin de base: \$BASE_PATH\"\necho \"Chemin actuel: \$(pwd)\"\n\n# Se déplacer dans le répertoire de l'application si nécessaire\nif [ \"\$(pwd)\" != \"\$BASE_PATH\" ]; then\n    echo \"Changement vers le répertoire \$BASE_PATH pour le diagnostic...\"\n    cd \"\$BASE_PATH\" || echo \"⚠️ Impossible d'accéder au répertoire \$BASE_PATH\"\n    echo \"Nouveau répertoire courant: \$(pwd)\"\nfi\n\n";
                    
                    // Insérer après la première section (après la ligne "echo ===")
                    $pattern = "/echo \"==+\"\n/";
                    if (preg_match($pattern, $updated_diagnostic)) {
                        $updated_diagnostic = preg_replace($pattern, "$0\n$base_path_code", $updated_diagnostic, 1);
                    } else {
                        // Au cas où le modèle n'est pas trouvé, ajouter après les commentaires initiaux
                        $updated_diagnostic = preg_replace("/(^.*?exécution via SSH.*?\n\n)/s", "$1$base_path_code", $updated_diagnostic, 1);
                    }
                    
                    echo "<li><code>ssh-diagnostic.sh</code> - <span class='success'>BASE_PATH ajouté et chemins mis à jour</span></li>";
                } elseif ($diagnostic_content !== $updated_diagnostic) {
                    echo "<li><code>ssh-diagnostic.sh</code> - <span class='success'>Chemins mis à jour</span></li>";
                } else {
                    echo "<li><code>ssh-diagnostic.sh</code> - <span class='success'>Aucune mise à jour nécessaire</span></li>";
                }
                
                if ($diagnostic_content !== $updated_diagnostic) {
                    file_put_contents('ssh-diagnostic.sh', $updated_diagnostic);
                }
            }
            
            // Mettre à jour diagnose-infomaniak.sh
            if (file_exists('diagnose-infomaniak.sh')) {
                $infomaniak_content = file_get_contents('diagnose-infomaniak.sh');
                $updated_infomaniak = str_replace('/home/customers', '/home/clients', $infomaniak_content);
                if ($infomaniak_content !== $updated_infomaniak) {
                    file_put_contents('diagnose-infomaniak.sh', $updated_infomaniak);
                    echo "<li><code>diagnose-infomaniak.sh</code> - <span class='success'>Mise à jour effectuée</span></li>";
                } else {
                    echo "<li><code>diagnose-infomaniak.sh</code> - <span class='success'>Aucune mise à jour nécessaire</span></li>";
                }
            }
            
            echo "</ul>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>5. Recommandations finales</h2>
        <p>Pour assurer le bon fonctionnement de votre application sur Infomaniak :</p>
        <ol>
            <li>Vérifiez que tous les chemins dans les fichiers de configuration utilisent <code>/home/clients/df8dceff557ccc0605d45e1581aa661b</code></li>
            <li>Assurez-vous que les permissions des fichiers sont correctes (644 pour les fichiers, 755 pour les dossiers)</li>
            <li>Vérifiez que les fichiers .htaccess sont correctement configurés pour Infomaniak</li>
            <li>Assurez-vous que la configuration de la base de données pointe vers les serveurs d'Infomaniak</li>
        </ol>
        
        <p>
            <a href="diagnose-infomaniak.php" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-right: 10px;">Lancer le diagnostic Infomaniak</a>
            <a href="phpinfo.php" style="display: inline-block; background-color: #4b5563; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Voir la configuration PHP</a>
        </p>
    </div>
    
    <div class="section">
        <h2>6. Structure des chemins sur Infomaniak</h2>
        <p>Voici la structure de chemins attendue pour cette installation :</p>
        <pre>
/home/clients/df8dceff557ccc0605d45e1581aa661b/     # Répertoire client
├── sites/                                         # Dossier contenant les sites
│   └── qualiopi.ch/                               # Dossier du site (racine web)
│       ├── api/                                   # API
│       │   ├── config/                            # Configuration de l'API
│       │   │   └── db_config.json                 # Configuration BD
│       │   ├── controllers/                       # Contrôleurs API
│       │   └── models/                            # Modèles de données
│       ├── assets/                                # Fichiers JS/CSS compilés
│       ├── public/                                # Fichiers publics
│       │   └── lovable-uploads/                   # Uploads d'images
│       ├── index.php                              # Point d'entrée PHP
│       ├── index.html                             # Point d'entrée HTML
│       └── .htaccess                              # Configuration Apache
        </pre>
    </div>
</body>
</html>
