
<?php
// Force l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Définir l'en-tête de contenu pour HTML
header('Content-Type: text/html; charset=UTF-8');

// Désactiver la mise en cache
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic système</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1, h2 { color: #333; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .info { color: blue; }
        .code { background: #f5f5f5; padding: 10px; border-left: 4px solid #ddd; overflow: auto; }
        .section { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Diagnostic système complet</h1>
    <p>Date du test: <?php echo date('Y-m-d H:i:s'); ?></p>
    
    <div class="section">
        <h2>1. Information sur le système PHP</h2>
        <?php if (function_exists('phpversion')): ?>
            <p class="success">PHP est correctement exécuté! Version: <?php echo phpversion(); ?></p>
            <table>
                <tr>
                    <th>Paramètre</th>
                    <th>Valeur</th>
                </tr>
                <tr>
                    <td>Serveur</td>
                    <td><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'; ?></td>
                </tr>
                <tr>
                    <td>Interface PHP</td>
                    <td><?php echo php_sapi_name(); ?></td>
                </tr>
                <tr>
                    <td>Système d'exploitation</td>
                    <td><?php echo PHP_OS; ?></td>
                </tr>
                <tr>
                    <td>Répertoire actuel</td>
                    <td><?php echo getcwd(); ?></td>
                </tr>
                <tr>
                    <td>Extensions chargées</td>
                    <td>
                        <?php 
                        $extensions = get_loaded_extensions();
                        $critical_extensions = ['pdo', 'pdo_mysql', 'mysql', 'mysqli', 'json', 'mbstring', 'curl'];
                        foreach ($critical_extensions as $ext) {
                            echo $ext . ': ' . (in_array($ext, $extensions) ? '<span class="success">Chargée</span>' : '<span class="error">Non chargée</span>') . '<br>';
                        }
                        ?>
                    </td>
                </tr>
            </table>
        <?php else: ?>
            <p class="error">PHP ne s'exécute pas correctement!</p>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>2. Vérification des fichiers et dossiers critiques</h2>
        <table>
            <tr>
                <th>Emplacement</th>
                <th>Existence</th>
                <th>Permissions</th>
                <th>Contenu</th>
            </tr>
            <?php
            $locations = [
                'API Root' => '.',
                'Root' => '..',
                'Assets' => '../assets',
                'Index HTML' => '../index.html',
                'API Index' => './index.php',
                'API htaccess' => './.htaccess',
                'Root htaccess' => '../.htaccess',
                'Public' => '../public'
            ];
            
            foreach($locations as $name => $path) {
                echo '<tr>';
                echo '<td>' . $name . '</td>';
                
                if (file_exists($path)) {
                    echo '<td><span class="success">Existe</span></td>';
                    echo '<td>' . (is_readable($path) ? '<span class="success">Lisible</span>' : '<span class="error">Non lisible</span>');
                    echo (is_writable($path) ? ', <span class="success">Inscriptible</span>' : ', <span class="error">Non inscriptible</span>') . '</td>';
                    
                    if (is_dir($path)) {
                        $files = scandir($path);
                        $fileCount = count($files) - 2; // Exclure . et ..
                        echo '<td>' . $fileCount . ' fichiers</td>';
                    } else {
                        $size = filesize($path);
                        echo '<td>' . $size . ' octets</td>';
                    }
                } else {
                    echo '<td><span class="error">N\'existe pas</span></td>';
                    echo '<td>N/A</td>';
                    echo '<td>N/A</td>';
                }
                
                echo '</tr>';
            }
            ?>
        </table>
    </div>
    
    <div class="section">
        <h2>3. Vérification des assets</h2>
        <?php
        $assets_dir = '../assets';
        echo "<h3>Répertoire assets: $assets_dir</h3>";
        
        if (file_exists($assets_dir) && is_dir($assets_dir)) {
            echo '<p class="success">Le répertoire assets existe et est accessible.</p>';
            
            $js_files = glob("$assets_dir/*.js");
            $css_files = glob("$assets_dir/*.css");
            
            echo '<h4>Fichiers JS (' . count($js_files) . ')</h4>';
            echo '<ul>';
            foreach ($js_files as $file) {
                $readable = is_readable($file) ? '<span class="success">Lisible</span>' : '<span class="error">Non lisible</span>';
                echo '<li>' . basename($file) . ' - ' . $readable . ' (' . filesize($file) . ' octets)</li>';
            }
            echo '</ul>';
            
            echo '<h4>Fichiers CSS (' . count($css_files) . ')</h4>';
            echo '<ul>';
            foreach ($css_files as $file) {
                $readable = is_readable($file) ? '<span class="success">Lisible</span>' : '<span class="error">Non lisible</span>';
                echo '<li>' . basename($file) . ' - ' . $readable . ' (' . filesize($file) . ' octets)</li>';
            }
            echo '</ul>';
        } else {
            echo '<p class="error">Le répertoire assets n\'existe pas ou n\'est pas accessible!</p>';
            echo '<p>Tentative de création du répertoire...</p>';
            
            if (!file_exists('../assets')) {
                if (mkdir('../assets', 0755, true)) {
                    echo '<p class="success">Répertoire assets créé avec succès!</p>';
                } else {
                    echo '<p class="error">Impossible de créer le répertoire assets.</p>';
                }
            }
        }
        ?>
    </div>
    
    <div class="section">
        <h2>4. Vérification des variables serveur</h2>
        <table>
            <tr>
                <th>Variable</th>
                <th>Valeur</th>
            </tr>
            <tr>
                <td>SERVER_NAME</td>
                <td><?php echo $_SERVER['SERVER_NAME'] ?? 'Non défini'; ?></td>
            </tr>
            <tr>
                <td>REQUEST_URI</td>
                <td><?php echo $_SERVER['REQUEST_URI'] ?? 'Non défini'; ?></td>
            </tr>
            <tr>
                <td>SCRIPT_NAME</td>
                <td><?php echo $_SERVER['SCRIPT_NAME'] ?? 'Non défini'; ?></td>
            </tr>
            <tr>
                <td>DOCUMENT_ROOT</td>
                <td><?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non défini'; ?></td>
            </tr>
            <tr>
                <td>HTTP_HOST</td>
                <td><?php echo $_SERVER['HTTP_HOST'] ?? 'Non défini'; ?></td>
            </tr>
            <tr>
                <td>HTTPS</td>
                <td><?php echo isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'Activé' : 'Désactivé'; ?></td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <h2>5. Tests de fonctionnalité</h2>
        
        <h3>Test JavaScript</h3>
        <div id="js-test">JavaScript ne fonctionne pas...</div>
        
        <h3>Test de création de fichier</h3>
        <?php
        $test_file = './test_write_' . time() . '.txt';
        $write_test = @file_put_contents($test_file, 'Test d\'écriture: ' . date('Y-m-d H:i:s'));
        
        if ($write_test !== false) {
            echo '<p class="success">Test d\'écriture réussi. Fichier créé: ' . $test_file . '</p>';
            // Suppression du fichier de test
            @unlink($test_file);
        } else {
            echo '<p class="error">Échec du test d\'écriture. Vérifiez les permissions du répertoire.</p>';
        }
        ?>
        
        <h3>Test des en-têtes de requête</h3>
        <?php
        echo '<div class="code">';
        foreach (getallheaders() as $name => $value) {
            echo htmlspecialchars("$name: $value") . "<br>";
        }
        echo '</div>';
        ?>
    </div>
    
    <div class="section">
        <h2>6. Solutions et étapes suivantes</h2>
        <?php if (!function_exists('phpversion')): ?>
            <p class="warning">PHP ne s'exécute pas correctement. Vérifiez que:</p>
            <ul>
                <li>Le module PHP est installé et activé sur votre serveur</li>
                <li>Les fichiers .htaccess sont correctement configurés</li>
                <li>Les associations de types MIME pour les fichiers .php sont correctes</li>
            </ul>
            
            <p>Pour corriger ce problème avec Infomaniak, essayez de:</p>
            <ol>
                <li>Vérifier que PHP est activé pour votre hébergement dans le Manager Infomaniak</li>
                <li>Contacter le support Infomaniak pour vérifier la configuration du serveur</li>
                <li>Vérifier que les fichiers .htaccess sont correctement chargés</li>
            </ol>
        <?php else: ?>
            <p class="success">PHP s'exécute correctement!</p>
        <?php endif; ?>
        
        <?php if (!file_exists('../assets')): ?>
            <p class="warning">Le répertoire assets est manquant. Assurez-vous qu'il est correctement créé lors du déploiement.</p>
        <?php endif; ?>
        
        <?php if (!file_exists('../index.html')): ?>
            <p class="warning">Le fichier index.html est manquant. Vérifiez votre processus de déploiement.</p>
        <?php endif; ?>
    </div>
    
    <script>
        // Test JavaScript
        document.getElementById('js-test').textContent = 'JavaScript fonctionne correctement!';
        document.getElementById('js-test').style.color = 'green';
        document.getElementById('js-test').style.fontWeight = 'bold';
    </script>
</body>
</html>
