<?php
header('Content-Type: text/html; charset=utf-8');
// Inclure les utilitaires si disponibles
if (file_exists('utils-assets.php')) {
    include_once 'utils-assets.php';
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test des Routes CSS et JS</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .info { background-color: #f0f8ff; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
    <!-- IMPORTANT: Pas de scripts ou styles externes pour éviter les conflits -->
</head>
<body>
    <h1>Test des Routes pour les fichiers CSS et JS</h1>
    
    <div class="section">
        <h2>Analyse de index.html</h2>
        <?php
        // Vérifie le contenu de index.html
        if (file_exists('index.html')) {
            $content = file_get_contents('index.html');
            echo "<div class='info'>Fichier index.html trouvé.</div>";
            
            // Analyse les références CSS
            preg_match_all('/<link[^>]*href=["\']([^"\']*\.css)["\']/i', $content, $cssMatches);
            
            // Analyse les références JS
            preg_match_all('/<script[^>]*src=["\']([^"\']*\.js)["\']/i', $content, $jsMatches);
            
            echo "<h3>Références CSS trouvées:</h3>";
            if (!empty($cssMatches[1])) {
                echo "<ul>";
                foreach ($cssMatches[1] as $cssPath) {
                    echo "<li>$cssPath";
                    
                    // Vérifier si le chemin est externe (commence par http ou //)
                    if (preg_match('/^(https?:)?\/\//', $cssPath)) {
                        echo " <span class='info'>(Ressource externe)</span>";
                    } else {
                        $fullPath = $_SERVER['DOCUMENT_ROOT'] . $cssPath;
                        if (file_exists($fullPath)) {
                            echo " <span class='success'>(Fichier existant)</span>";
                        } else {
                            echo " <span class='error'>(Fichier introuvable)</span>";
                        }
                    }
                    echo "</li>";
                }
                echo "</ul>";
            } else {
                echo "<p class='warning'>Aucune référence CSS trouvée dans index.html</p>";
            }
            
            echo "<h3>Références JavaScript trouvées:</h3>";
            if (!empty($jsMatches[1])) {
                echo "<ul>";
                foreach ($jsMatches[1] as $jsPath) {
                    echo "<li>$jsPath";
                    
                    // Vérifier si le chemin est externe (commence par http ou //)
                    if (preg_match('/^(https?:)?\/\//', $jsPath)) {
                        echo " <span class='info'>(Ressource externe)</span>";
                    } else {
                        $fullPath = $_SERVER['DOCUMENT_ROOT'] . $jsPath;
                        if (file_exists($fullPath)) {
                            echo " <span class='success'>(Fichier existant)</span>";
                        } else {
                            echo " <span class='error'>(Fichier introuvable)</span>";
                        }
                    }
                    echo "</li>";
                }
                echo "</ul>";
            } else {
                echo "<p class='warning'>Aucune référence JavaScript trouvée dans index.html</p>";
            }
        } else {
            echo "<p class='error'>Fichier index.html introuvable!</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Scan du dossier assets</h2>
        <?php
        // Cherche les fichiers CSS et JS dans le dossier assets
        $assetsDir = $_SERVER['DOCUMENT_ROOT'] . '/assets';
        $alternateAssetsDir = './assets';
        
        function scanForAssets($dir, $label) {
            if (is_dir($dir)) {
                echo "<h3>Fichiers dans $label:</h3>";
                
                $jsFiles = glob("$dir/*.js");
                $cssFiles = glob("$dir/*.css");
                
                echo "<table>";
                echo "<tr><th>Type</th><th>Nom du fichier</th><th>Taille</th><th>Dernière modification</th></tr>";
                
                // Liste des fichiers JS
                foreach ($jsFiles as $file) {
                    $filename = basename($file);
                    $size = filesize($file);
                    $lastModified = date("Y-m-d H:i:s", filemtime($file));
                    echo "<tr><td>JS</td><td>$filename</td><td>$size octets</td><td>$lastModified</td></tr>";
                }
                
                // Liste des fichiers CSS
                foreach ($cssFiles as $file) {
                    $filename = basename($file);
                    $size = filesize($file);
                    $lastModified = date("Y-m-d H:i:s", filemtime($file));
                    echo "<tr><td>CSS</td><td>$filename</td><td>$size octets</td><td>$lastModified</td></tr>";
                }
                
                echo "</table>";
                
                return count($jsFiles) + count($cssFiles);
            } else {
                echo "<p class='warning'>Le dossier $label n'existe pas.</p>";
                return 0;
            }
        }
        
        $assetCount = scanForAssets($assetsDir, "assets (chemin absolu)");
        
        if ($assetCount == 0) {
            scanForAssets($alternateAssetsDir, "assets (chemin relatif)");
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Test d'accès HTTP</h2>
        <?php
        // Test d'accès HTTP aux fichiers
        function testFileAccess($url) {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HEADER, true);
            curl_setopt($ch, CURLOPT_NOBODY, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Désactiver la vérification SSL pour les tests
            curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
            $size = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
            $error = curl_error($ch);
            curl_close($ch);
            
            return [
                'httpCode' => $httpCode,
                'contentType' => $contentType,
                'size' => $size,
                'error' => $error
            ];
        }
        
        // Trouver les fichiers à tester
        $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
        $filesToTest = [];
        
        // Ajouter les fichiers de index.html
        if (isset($cssMatches[1]) && !empty($cssMatches[1])) {
            foreach ($cssMatches[1] as $path) {
                $filesToTest[] = ['path' => $path, 'type' => 'CSS', 'source' => 'index.html'];
            }
        }
        
        if (isset($jsMatches[1]) && !empty($jsMatches[1])) {
            foreach ($jsMatches[1] as $path) {
                $filesToTest[] = ['path' => $path, 'type' => 'JavaScript', 'source' => 'index.html'];
            }
        }
        
        // Ajouter quelques fichiers du dossier assets
        $assetsDir = $_SERVER['DOCUMENT_ROOT'] . '/assets';
        $alternateAssetsDir = './assets';
        
        // Fonction pour ajouter des exemples de fichiers
        function addSampleFiles($dir, $source, &$filesToTest) {
            if (!is_dir($dir)) return;
            
            $jsFiles = glob("$dir/*.js");
            $cssFiles = glob("$dir/*.css");
            
            if (!empty($jsFiles)) {
                $filesToTest[] = [
                    'path' => '/assets/' . basename($jsFiles[0]), 
                    'type' => 'JavaScript', 
                    'source' => $source
                ];
            }
            
            if (!empty($cssFiles)) {
                $filesToTest[] = [
                    'path' => '/assets/' . basename($cssFiles[0]), 
                    'type' => 'CSS', 
                    'source' => $source
                ];
            }
        }
        
        addSampleFiles($assetsDir, 'assets directory', $filesToTest);
        if (count($filesToTest) < 3) {
            addSampleFiles($alternateAssetsDir, 'assets directory (relative)', $filesToTest);
        }
        
        // Effectuer les tests HTTP
        if (!empty($filesToTest)) {
            echo "<h3>Résultats des tests d'accès HTTP:</h3>";
            echo "<table>";
            echo "<tr><th>Type</th><th>Chemin</th><th>Source</th><th>Code HTTP</th><th>Type MIME</th><th>Taille</th><th>Erreur</th></tr>";
            
            foreach ($filesToTest as $file) {
                $url = preg_match('/^(https?:)?\/\//', $file['path']) ? $file['path'] : $baseUrl . $file['path'];
                $result = testFileAccess($url);
                
                $statusClass = ($result['httpCode'] >= 200 && $result['httpCode'] < 300) ? 'success' : 'error';
                $mimeClass = 'info';
                
                if ($result['httpCode'] >= 200 && $result['httpCode'] < 300) {
                    if ($file['type'] == 'CSS' && strpos($result['contentType'], 'css') === false) {
                        $mimeClass = 'error';
                    } else if ($file['type'] == 'JavaScript' && strpos($result['contentType'], 'javascript') === false) {
                        $mimeClass = 'error';
                    }
                }
                
                echo "<tr>";
                echo "<td>{$file['type']}</td>";
                echo "<td>{$file['path']}</td>";
                echo "<td>{$file['source']}</td>";
                echo "<td class='$statusClass'>{$result['httpCode']}</td>";
                echo "<td class='$mimeClass'>{$result['contentType']}</td>";
                echo "<td>" . ($result['size'] > 0 ? $result['size'] . " octets" : "Inconnu") . "</td>";
                echo "<td>" . ($result['error'] ? "<span class='error'>{$result['error']}</span>" : "") . "</td>";
                echo "</tr>";
            }
            
            echo "</table>";
        } else {
            echo "<p class='warning'>Aucun fichier à tester.</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Vérification de la configuration MIME</h2>
        <?php
        // Vérifier la configuration MIME dans .htaccess
        $htaccessPaths = ['./.htaccess', './assets/.htaccess'];
        $mimeConfigFound = false;
        
        foreach ($htaccessPaths as $path) {
            if (file_exists($path)) {
                $htaccess = file_get_contents($path);
                echo "<h3>Configuration MIME dans $path:</h3>";
                
                $hasJsMime = preg_match('/AddType\s+application\/javascript\s+\.js/i', $htaccess);
                $hasCssMime = preg_match('/AddType\s+text\/css\s+\.css/i', $htaccess);
                $hasJsForce = preg_match('/ForceType\s+application\/javascript/i', $htaccess);
                $hasCssForce = preg_match('/ForceType\s+text\/css/i', $htaccess);
                
                echo "<ul>";
                echo "<li>Définition du type MIME JS: " . ($hasJsMime ? "<span class='success'>Présente</span>" : "<span class='warning'>Absente</span>") . "</li>";
                echo "<li>Définition du type MIME CSS: " . ($hasCssMime ? "<span class='success'>Présente</span>" : "<span class='warning'>Absente</span>") . "</li>";
                echo "<li>Force du type MIME JS: " . ($hasJsForce ? "<span class='success'>Présente</span>" : "<span class='warning'>Absente</span>") . "</li>";
                echo "<li>Force du type MIME CSS: " . ($hasCssForce ? "<span class='success'>Présente</span>" : "<span class='warning'>Absente</span>") . "</li>";
                echo "</ul>";
                
                if ($hasJsMime && $hasCssMime) {
                    $mimeConfigFound = true;
                }
            }
        }
        
        if (!$mimeConfigFound) {
            echo "<p class='warning'>Aucune configuration MIME complète trouvée dans les fichiers .htaccess.</p>";
            echo "<p>Vous pourriez avoir besoin d'ajouter les directives suivantes:</p>";
            echo "<pre>
# Configuration des types MIME
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css

# Force le type MIME pour CSS et JS
&lt;FilesMatch \"\.css$\"&gt;
    ForceType text/css
    Header set Content-Type \"text/css; charset=utf-8\"
&lt;/FilesMatch&gt;

&lt;FilesMatch \"\.js$\"&gt;
    ForceType application/javascript
    Header set Content-Type \"application/javascript; charset=utf-8\"
&lt;/FilesMatch&gt;
</pre>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Ajout d'une vérification spécifique aux fichiers hachés</h2>
        <?php
        // Recherche spécifique des fichiers CSS et JS avec des noms hachés
        echo "<h3>Recherche des fichiers hachés:</h3>";
        
        function findHashedFiles($dir) {
            if (!is_dir($dir)) return [];
            
            $hashedJsFiles = glob("$dir/main-*.js") ?: glob("$dir/*.[a-zA-Z0-9]*.js");
            $hashedCssFiles = glob("$dir/index-*.css") ?: glob("$dir/*.[a-zA-Z0-9]*.css");
            
            return [
                'js' => $hashedJsFiles,
                'css' => $hashedCssFiles
            ];
        }
        
        $hashedFiles = findHashedFiles($assetsDir);
        if (count($hashedFiles['js']) == 0 && count($hashedFiles['css']) == 0) {
            $hashedFiles = findHashedFiles($alternateAssetsDir);
        }
        
        if (count($hashedFiles['js']) > 0 || count($hashedFiles['css']) > 0) {
            echo "<table>";
            echo "<tr><th>Type</th><th>Fichier trouvé</th><th>Référencé dans index.html</th></tr>";
            
            foreach ($hashedFiles['js'] as $file) {
                $filename = basename($file);
                $isReferenced = strpos($content, $filename) !== false;
                echo "<tr>";
                echo "<td>JS</td>";
                echo "<td>$filename</td>";
                echo "<td>" . ($isReferenced ? "<span class='success'>Oui</span>" : "<span class='error'>Non</span>") . "</td>";
                echo "</tr>";
            }
            
            foreach ($hashedFiles['css'] as $file) {
                $filename = basename($file);
                $isReferenced = strpos($content, $filename) !== false;
                echo "<tr>";
                echo "<td>CSS</td>";
                echo "<td>$filename</td>";
                echo "<td>" . ($isReferenced ? "<span class='success'>Oui</span>" : "<span class='error'>Non</span>") . "</td>";
                echo "</tr>";
            }
            
            echo "</table>";
        } else {
            echo "<p>Aucun fichier avec nom haché trouvé.</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Solutions possibles</h2>
        
        <h3>Si vos fichiers CSS ne sont pas chargés correctement:</h3>
        <ol>
            <li>Vérifiez que les fichiers existent bien dans le dossier assets</li>
            <li>Assurez-vous que index.html référence les bons chemins</li>
            <li>Ajoutez les types MIME corrects dans .htaccess</li>
            <li>Vérifiez que le serveur web permet l'accès aux fichiers statiques</li>
        </ol>
        
        <h3>Pour les noms de fichiers hachés:</h3>
        <ol>
            <li>Si vous utilisez Vite, vérifiez la configuration de build dans vite.config.ts</li>
            <li>Assurez-vous que les fichiers de builds sont bien copiés dans le dossier assets</li>
            <li>Utilisez le script fix-index-html.php pour mettre à jour automatiquement les références</li>
        </ol>
        
        <form method="post" action="fix-mime-types-css.php">
            <button type="submit" class="fix-button">Corriger les types MIME CSS</button>
        </form>
        <br>
        <form method="post" action="fix-index-assets.php">
            <button type="submit" class="fix-button">Mettre à jour les références dans index.html</button>
        </form>
    </div>
    
    <div class="section">
        <h2>Créer un fichier JS de test pour vérifier le type MIME</h2>
        <?php
        // Créer un fichier JS de test si nécessaire
        $testJsPath = "./check-js-mime.php";
        if (!file_exists($testJsPath)) {
            $testJsContent = '<?php
header(\'Content-Type: text/html; charset=utf-8\');
?>
<!DOCTYPE html>
<html>
<head>
    <title>JavaScript MIME Type Checker</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>JavaScript MIME Type Checker</h1>
    
    <div class="test-section">
        <h2>Test de chargement des modules</h2>
        <div id="module-test-result">Test en cours...</div>
        
        <script type="module">
            document.getElementById(\'module-test-result\').innerHTML = \'<span class="success">✓ Module JavaScript chargé avec succès!</span>\';
        </script>
    </div>
    
    <div class="test-section">
        <h2>Vérification des en-têtes</h2>
        <div id="headers-result">Chargement des résultats...</div>
        
        <script>
            // Fonction pour tester les en-têtes HTTP
            async function checkHeaders() {
                try {
                    const response = await fetch(\'/assets/index.js?t=\' + new Date().getTime());
                    const contentType = response.headers.get(\'content-type\');
                    const status = response.status;
                    
                    let result = `<p>Status: ${status}</p>`;
                    result += `<p>Content-Type: <span class="${contentType && contentType.includes(\'javascript\') ? \'success\' : \'error\'}">${contentType || \'Non défini\'}</span></p>`;
                    
                    document.getElementById(\'headers-result\').innerHTML = result;
                } catch (error) {
                    document.getElementById(\'headers-result\').innerHTML = `<p class="error">Erreur lors du test: ${error.message}</p>`;
                }
            }
            
            // Exécuter le test des en-têtes
            checkHeaders();
        </script>
    </div>
    
    <div class="test-section">
        <h2>Information du serveur</h2>
        <?php
        echo "<p>PHP version: " . phpversion() . "</p>";
        echo "<p>Serveur web: " . ($_SERVER[\'SERVER_SOFTWARE\'] ?? \'Non disponible\') . "</p>";
        
        // Vérifier si le fichier .htaccess est correctement appliqué
        echo "<p>Vérification des fichiers de configuration:</p>";
        echo "<ul>";
        echo "<li>.htaccess racine: " . (file_exists(\'.htaccess\') ? \'<span class="success">Existe</span>\' : \'<span class="error">Manquant</span>\') . "</li>";
        echo "<li>assets/.htaccess: " . (file_exists(\'assets/.htaccess\') ? \'<span class="success">Existe</span>\' : \'<span class="error">Manquant</span>\') . "</li>";
        echo "</ul>";
        ?>
    </div>
    
    <div class="test-section">
        <h2>Que faire si le problème persiste</h2>
        <ol>
            <li>Vérifiez que le module <code>mod_headers</code> est activé sur votre serveur Apache</li>
            <li>Assurez-vous que les fichiers .htaccess ne sont pas ignorés (AllowOverride All doit être configuré)</li>
            <li>Si vous utilisez un CDN ou un proxy, vérifiez qu\'il ne modifie pas les en-têtes HTTP</li>
            <li>Essayez de forcer le type MIME dans les balises script: <code>&lt;script type="application/javascript" src="..."&gt;&lt;/script&gt;</code></li>
            <li>Contactez votre hébergeur (Infomaniak) pour vérifier la configuration du serveur</li>
        </ol>
    </div>
</body>
</html>';

            file_put_contents($testJsPath, $testJsContent);
            echo "<p class='success'>Fichier de test MIME JS créé : <a href='check-js-mime.php' target='_blank'>check-js-mime.php</a></p>";
        } else {
            echo "<p class='info'>Fichier de test MIME JS disponible : <a href='check-js-mime.php' target='_blank'>check-js-mime.php</a></p>";
        }
        
        // Créer un script pour mettre à jour index.html si nécessaire
        $fixIndexPath = "./fix-index-html.php";
        if (!file_exists($fixIndexPath)) {
            $fixIndexContent = '<?php
header(\'Content-Type: text/html; charset=utf-8\');

function findLatestAsset($pattern) {
    $files = glob($pattern);
    if (empty($files)) return null;
    
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    
    return $files[0];
}

// Find the latest JS and CSS files in the assets directory
$jsFile = findLatestAsset(\'./assets/main-*.js\') ?: findLatestAsset(\'./assets/*.js\');
$cssFile = findLatestAsset(\'./assets/index-*.css\') ?: findLatestAsset(\'./assets/*.css\');

// Path to index.html
$indexPath = \'./index.html\';

// Check if index.html exists
if (!file_exists($indexPath)) {
    die("Error: index.html file not found.");
}

// Create a backup of the original file
copy($indexPath, $indexPath . \'.bak\');

// Get the content of index.html
$content = file_get_contents($indexPath);

$updated = false;

// Replace JavaScript reference
if ($jsFile) {
    $jsPath = str_replace(\'./\', \'/\', $jsFile);
    $newContent = preg_replace(
        \'/<script[^>]*src=["\'](\.\/|\\/)?src\\/[^"\']*\\.tsx?["\'][^>]*>/\',
        \'<script type="module" src="\' . $jsPath . \'">\',
        $content
    );
    
    if ($newContent !== $content) {
        $content = $newContent;
        $updated = true;
        echo "Updated JavaScript reference to: " . $jsPath . "<br>";
    }
}

// Replace CSS reference
if ($cssFile) {
    $cssPath = str_replace(\'./\', \'/\', $cssFile);
    $newContent = preg_replace(
        \'/<link[^>]*href=["\'](\.\/|\\/)?src\\/[^"\']*\\.css["\'][^>]*>/\',
        \'<link rel="stylesheet" href="\' . $cssPath . \'">\',
        $content
    );
    
    if ($newContent !== $content) {
        $content = $newContent;
        $updated = true;
        echo "Updated CSS reference to: " . $cssPath . "<br>";
    }
}

// Ensure the GPT Engineer script tag is present
if (!strpos($content, \'cdn.gpteng.co/gptengineer.js\')) {
    $content = preg_replace(
        \'/<\\/body>/\',
        \'  <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>\' . PHP_EOL . \'</body>\',
        $content
    );
    $updated = true;
    echo "Added GPT Engineer script tag<br>";
}

// Save the updated content back to index.html
if ($updated) {
    file_put_contents($indexPath, $content);
    echo "<br>Successfully updated index.html with correct asset references!<br>";
    echo "A backup of the original file has been saved as index.html.bak<br>";
} else {
    echo "<br>No updates needed or no asset files found.<br>";
    if (!$jsFile) echo "No JavaScript file found in assets directory.<br>";
    if (!$cssFile) echo "No CSS file found in assets directory.<br>";
}

// Display new content for verification
echo "<br><strong>Updated index.html content:</strong><br>";
echo "<pre>" . htmlspecialchars($content) . "</pre>";
?>';

            file_put_contents($fixIndexPath, $fixIndexContent);
            echo "<p class='success'>Script de mise à jour de l'index créé : <a href='fix-index-html.php' target='_blank'>fix-index-html.php</a></p>";
        } else {
            echo "<p class='info'>Script de mise à jour de l'index disponible : <a href='fix-index-html.php' target='_blank'>fix-index-html.php</a></p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Liens utiles</h2>
        <ul>
            <li><a href="check-js-mime.php">Test des types MIME JavaScript</a></li>
            <li><a href="fix-index-html.php">Mise à jour des références dans index.html</a></li>
            <li><a href="github-connectivity-test.php">Test de connectivité GitHub</a></li>
            <li><a href="update-github-workflow.php">Gérer les Workflows GitHub</a></li>
            <li><a href="phpinfo.php">Informations PHP</a></li>
        </ul>
    </div>
</body>
</html>
