
<?php
header('Content-Type: text/html; charset=utf-8');
require_once 'utils-directory.php';
require_once 'utils-assets.php';
require_once 'index-validator.php';
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic de Déploiement des Assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        .fix-button:hover { background: #45a049; }
    </style>
</head>
<body>
    <h1>Diagnostic de Déploiement des Assets</h1>
    
    <div class="section">
        <h2>1. Détection de l'environnement</h2>
        <?php
        $hostname = $_SERVER['HTTP_HOST'];
        $is_infomaniak = strpos($hostname, 'infomaniak') !== false || strpos($hostname, 'qualiopi.ch') !== false;
        
        echo "<p>Hostname: <strong>$hostname</strong></p>";
        echo "<p>Environnement: <strong>" . ($is_infomaniak ? "Infomaniak Production" : "Développement ou Test") . "</strong></p>";
        echo "<p>Document Root: <strong>" . $_SERVER['DOCUMENT_ROOT'] . "</strong></p>";
        echo "<p>Script Path: <strong>" . __FILE__ . "</strong></p>";
        ?>
    </div>
    
    <div class="section">
        <h2>2. Structure des dossiers</h2>
        <?php
        $directories = [
            './' => 'Répertoire racine',
            './assets' => 'Dossier des assets',
            './dist' => 'Dossier dist',
            './dist/assets' => 'Dossier dist/assets',
            './src' => 'Dossier source'
        ];
        
        foreach ($directories as $dir => $desc) {
            $count = check_directory($dir);
            echo "<p>$desc ($dir): ";
            if ($count !== false) {
                echo "<span class='success'>EXISTE</span> ($count fichiers/dossiers)";
            } else {
                echo "<span class='error'>N'EXISTE PAS</span>";
            }
            echo "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>3. Fichiers d'assets</h2>
        <?php
        // Chercher les assets dans différents dossiers
        $asset_dirs = ['./assets', './dist/assets'];
        
        foreach ($asset_dirs as $dir) {
            if (is_dir($dir)) {
                echo "<h3>Dossier $dir</h3>";
                
                $js_files = find_assets_in_dir($dir, 'js');
                $css_files = find_assets_in_dir($dir, 'css');
                
                echo "<p>Fichiers JavaScript: " . (count($js_files) > 0 ? "<span class='success'>" . count($js_files) . " trouvés</span>" : "<span class='error'>Aucun</span>") . "</p>";
                if (count($js_files) > 0) {
                    echo "<ul>";
                    echo list_assets($js_files);
                    echo "</ul>";
                }
                
                echo "<p>Fichiers CSS: " . (count($css_files) > 0 ? "<span class='success'>" . count($css_files) . " trouvés</span>" : "<span class='error'>Aucun</span>") . "</p>";
                if (count($css_files) > 0) {
                    echo "<ul>";
                    echo list_assets($css_files);
                    echo "</ul>";
                }
                
                list($latest_js, $latest_js_time) = find_latest_asset($js_files, 'main-');
                list($latest_css, $latest_css_time) = find_latest_asset($css_files, 'index-');
                
                if ($latest_js) {
                    echo "<p>Dernier fichier JS principal: <span class='success'>$latest_js</span> (" . date('Y-m-d H:i:s', $latest_js_time) . ")</p>";
                }
                
                if ($latest_css) {
                    echo "<p>Dernier fichier CSS principal: <span class='success'>$latest_css</span> (" . date('Y-m-d H:i:s', $latest_css_time) . ")</p>";
                }
            }
        }
        ?>
    </div>
    
    <div class="section">
        <h2>4. Analyse de index.html</h2>
        <?php
        if (file_exists('./index.html')) {
            $index_content = file_get_contents('./index.html');
            $refs = validate_index_references($index_content);
            
            echo "<p>Référence à un fichier JavaScript compilé: " . ($refs['has_js_reference'] ? "<span class='success'>OUI</span>" : "<span class='error'>NON</span>") . "</p>";
            echo "<p>Référence à un fichier CSS compilé: " . ($refs['has_css_reference'] ? "<span class='success'>OUI</span>" : "<span class='error'>NON</span>") . "</p>";
            echo "<p>Référence à un fichier source (/src/): " . ($refs['has_src_reference'] ? "<span class='warning'>OUI</span> (à remplacer en production)" : "<span class='success'>NON</span>") . "</p>";
            
            echo "<pre>" . htmlspecialchars($index_content) . "</pre>";
        } else {
            echo "<p><span class='error'>Le fichier index.html n'existe pas</span></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>5. Actions recommandées</h2>
        <?php
        $recommendations = [];
        
        // Vérifier si les dossiers d'assets sont présents
        if (!is_dir('./assets') && is_dir('./dist/assets')) {
            $recommendations[] = "Créer le dossier <code>assets</code> à la racine et y copier les fichiers depuis <code>dist/assets</code>.";
        }
        
        // Vérifier les références dans index.html
        if (file_exists('./index.html')) {
            $index_content = file_get_contents('./index.html');
            $refs = validate_index_references($index_content);
            
            if ($refs['has_src_reference'] && !$refs['has_js_reference']) {
                $recommendations[] = "Mettre à jour index.html pour référencer les fichiers JS compilés au lieu des fichiers source.";
            }
            
            if (!$refs['has_css_reference']) {
                $recommendations[] = "Ajouter une référence au fichier CSS compilé dans index.html.";
            }
        }
        
        if (!empty($recommendations)) {
            echo "<ul>";
            foreach ($recommendations as $rec) {
                echo "<li>$rec</li>";
            }
            echo "</ul>";
            
            echo "<p>Utilisez l'un des scripts de correction suivants :</p>";
            echo "<ul>";
            echo "<li><a href='fix-directory-structure.php'><strong>fix-directory-structure.php</strong></a> - Corrige la structure des dossiers</li>";
            echo "<li><a href='fix-index-references.php'><strong>fix-index-references.php</strong></a> - Corrige les références dans index.html</li>";
            echo "<li><a href='fix-assets-runtime.php'><strong>fix-assets-runtime.php</strong></a> - Détecte et corrige les références aux assets en temps réel</li>";
            echo "</ul>";
        } else {
            echo "<p><span class='success'>Votre configuration semble correcte</span></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>6. Statut d'authentification</h2>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                var authStatus = document.getElementById('auth-status');
                var isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                var authToken = localStorage.getItem('authToken');
                var currentUser = localStorage.getItem('currentUser');
                
                authStatus.innerHTML = '<p>Statut de connexion: <strong>' + (isLoggedIn ? 'Connecté' : 'Non connecté') + '</strong></p>';
                authStatus.innerHTML += '<p>Token d\'authentification: <strong>' + (authToken ? 'Présent' : 'Absent') + '</strong></p>';
                if (currentUser) {
                    authStatus.innerHTML += '<p>Utilisateur actuel: <strong>' + currentUser + '</strong></p>';
                }
                
                if (isLoggedIn) {
                    var logoutBtn = document.createElement('button');
                    logoutBtn.innerText = 'Se déconnecter';
                    logoutBtn.className = 'fix-button';
                    logoutBtn.onclick = function() {
                        localStorage.removeItem('isLoggedIn');
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('currentUser');
                        localStorage.removeItem('userRole');
                        localStorage.removeItem('userName');
                        alert('Déconnexion effectuée');
                        location.reload();
                    };
                    authStatus.appendChild(logoutBtn);
                }
            });
        </script>
        <div id="auth-status">
            <p>Chargement des informations d'authentification...</p>
        </div>
    </div>
</body>
</html>
