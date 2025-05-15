
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Vérification du Déploiement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; background-color: #f0fff0; padding: 5px; }
        .error { color: red; font-weight: bold; background-color: #fff0f0; padding: 5px; }
        .warning { color: orange; font-weight: bold; background-color: #fffaf0; padding: 5px; }
        .section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .details { display: flex; gap: 20px; flex-wrap: wrap; }
        .detail-box { flex: 1; min-width: 300px; }
        .fix-button { 
            background-color: #4CAF50; 
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>Vérification du Déploiement</h1>
    
    <div class="section">
        <h2>Fichiers Critiques</h2>
        <?php
        $critical_files = [
            './api/.htaccess' => 'Configuration de l\'API',
            './api/config/env.php' => 'Variables d\'environnement',
            './api/config/db_config.json' => 'Configuration de la base de données',
            './index.php' => 'Redirection vers index.html'
        ];
        
        $all_ok = true;
        foreach ($critical_files as $file => $desc) {
            echo "<div>";
            if (file_exists($file)) {
                $size = filesize($file);
                echo "<p><strong>$file</strong> ($desc): <span class='success'>PRÉSENT</span> ($size octets)</p>";
            } else {
                echo "<p><strong>$file</strong> ($desc): <span class='error'>MANQUANT</span></p>";
                $all_ok = false;
            }
            echo "</div>";
        }
        
        if (!$all_ok) {
            echo "<div class='warning'><p>Des fichiers critiques sont manquants. Utilisez le script de correction d'urgence.</p>";
            echo "<a href='emergency-deploy-fix.php' class='fix-button'>Exécuter la correction d'urgence</a></div>";
        } else {
            echo "<div class='success'><p>Tous les fichiers critiques sont présents.</p></div>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Structure des Dossiers et Fichiers</h2>
        <div class="details">
            <div class="detail-box">
                <?php
                function count_files($dir) {
                    if (!is_dir($dir)) return 0;
                    $count = 0;
                    $files = scandir($dir);
                    foreach ($files as $file) {
                        if ($file != "." && $file != "..") {
                            if (is_file("$dir/$file")) $count++;
                        }
                    }
                    return $count;
                }
                
                $directories = [
                    './' => 'Répertoire racine',
                    './api' => 'API',
                    './api/config' => 'Configuration API',
                    './assets' => 'Assets',
                    './public' => 'Fichiers publics',
                    './public/lovable-uploads' => 'Uploads'
                ];
                
                foreach ($directories as $dir => $name) {
                    $count = count_files($dir);
                    echo "<p>$name ($dir): ";
                    if (is_dir($dir)) {
                        echo "<span class='success'>EXISTE</span> ($count fichiers)";
                    } else {
                        echo "<span class='error'>N'EXISTE PAS</span>";
                    }
                    echo "</p>";
                }
                ?>
            </div>
            
            <div class="detail-box">
                <h3>Fichiers JavaScript</h3>
                <?php
                $js_files = glob('./assets/*.js');
                if (!empty($js_files)) {
                    echo "<p>Nombre de fichiers JS: <span class='success'>" . count($js_files) . "</span></p>";
                    echo "<ul>";
                    foreach (array_slice($js_files, 0, 5) as $file) {
                        echo "<li>" . basename($file) . "</li>";
                    }
                    if (count($js_files) > 5) {
                        echo "<li>...</li>";
                    }
                    echo "</ul>";
                } else {
                    echo "<p>Aucun fichier JavaScript trouvé dans ./assets/</p>";
                }
                ?>
                
                <h3>Fichiers CSS</h3>
                <?php
                $css_files = glob('./assets/*.css');
                if (!empty($css_files)) {
                    echo "<p>Nombre de fichiers CSS: <span class='success'>" . count($css_files) . "</span></p>";
                    echo "<ul>";
                    foreach (array_slice($css_files, 0, 5) as $file) {
                        echo "<li>" . basename($file) . "</li>";
                    }
                    if (count($css_files) > 5) {
                        echo "<li>...</li>";
                    }
                    echo "</ul>";
                } else {
                    echo "<p>Aucun fichier CSS trouvé dans ./assets/</p>";
                }
                ?>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Tests de Fonctionnement</h2>
        <div class="details">
            <div class="detail-box">
                <h3>Test de l'API</h3>
                <?php
                $api_url = "./api/phpinfo.php";
                $api_test = @file_get_contents($api_url);
                if ($api_test !== false) {
                    echo "<p>Test de l'API: <span class='success'>OK</span></p>";
                } else {
                    echo "<p>Test de l'API: <span class='error'>ÉCHEC</span></p>";
                    echo "<p>Erreur: " . error_get_last()['message'] . "</p>";
                }
                ?>
                
                <h3>Test du Serveur Web</h3>
                <?php
                $web_test = @file_get_contents("./index.php");
                if ($web_test !== false) {
                    echo "<p>Test du serveur web: <span class='success'>OK</span></p>";
                } else {
                    echo "<p>Test du serveur web: <span class='error'>ÉCHEC</span></p>";
                    echo "<p>Erreur: " . error_get_last()['message'] . "</p>";
                }
                ?>
            </div>
            
            <div class="detail-box">
                <h3>Liens Utiles</h3>
                <ul>
                    <li><a href="phpinfo.php" target="_blank">phpinfo()</a> - Informations PHP</li>
                    <li><a href="api/phpinfo.php" target="_blank">API phpinfo()</a> - Informations PHP dans l'API</li>
                    <li><a href="emergency-deploy-fix.php" target="_blank">Script de correction d'urgence</a> - Réparer les fichiers critiques</li>
                    <li><a href="index.html" target="_blank">Application principale</a> - Accéder à l'application</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>
