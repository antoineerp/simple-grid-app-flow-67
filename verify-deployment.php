
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Vérification du déploiement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; max-width: 1200px; margin: 0 auto; }
        h1, h2, h3 { color: #333; }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; }
        .warning { color: orange; background-color: #fffbf0; padding: 10px; border-left: 3px solid orange; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .button {
            display: inline-block;
            padding: 10px 15px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <h1>Vérification de déploiement</h1>
    
    <?php
    // Fichiers importants à vérifier
    $important_files = [
        'src/App.tsx' => 'Fichier principal des routes React',
        'assets/index.js' => 'Script JavaScript principal',
        'assets/main.css' => 'Feuille de style principale',
        'index.html' => 'Page HTML d\'entrée',
        'api-tools/check-routes.php' => 'Outil de vérification des routes',
        'api-tools/fix-routes.php' => 'Outil de correction des routes',
        'api/.htaccess' => 'Configuration Apache pour l\'API'
    ];
    
    // Source code files
    $source_files = [
        'src/App.tsx' => 'Fichier des routes',
        'src/components/layout/Layout.tsx' => 'Layout principal',
        'src/pages/Index.tsx' => 'Page d\'accueil',
        'src/pages/Pilotage.tsx' => 'Page de pilotage',
        'src/pages/GestionDocumentaire.tsx' => 'Page de gestion documentaire',
        'src/pages/RessourcesHumaines.tsx' => 'Page des ressources humaines'
    ];
    
    // Assets
    $assets = [
        'assets/index.js' => 'Script principal',
        'assets/main.js' => 'Script secondaire',
        'assets/main.css' => 'Style principal',
        'assets/index.css' => 'Style secondaire'
    ];
    
    // Verification function
    function check_file($file) {
        if (file_exists($file)) {
            $size = filesize($file);
            $time = filemtime($file);
            $readable = is_readable($file) ? 'Oui' : 'Non';
            
            return [
                'exists' => true,
                'size' => $size,
                'time' => date('Y-m-d H:i:s', $time),
                'readable' => $readable,
                'content_sample' => (in_array(pathinfo($file, PATHINFO_EXTENSION), ['php', 'js', 'css', 'html', 'tsx', 'ts'])) ? 
                    substr(file_get_contents($file), 0, 100) . '...' : 'Non affiché'
            ];
        }
        return ['exists' => false];
    }
    
    // Check for duplicate routes in App.tsx
    function check_route_duplicates() {
        $app_tsx_path = 'src/App.tsx';
        
        if (!file_exists($app_tsx_path)) {
            return ["error" => "Fichier non trouvé: $app_tsx_path"];
        }
        
        $content = file_get_contents($app_tsx_path);
        $routes = [];
        
        // Search for route definitions: <Route path="..."
        preg_match_all('/<Route\s+path=[\'"]([^\'"]*)[\'"]/', $content, $matches);
        
        if (!empty($matches[1])) {
            foreach ($matches[1] as $route) {
                if (!isset($routes[$route])) {
                    $routes[$route] = 1;
                } else {
                    $routes[$route]++;
                }
            }
        }
        
        return $routes;
    }
    
    // Get asset statistics
    function get_asset_stats() {
        $asset_dir = 'assets';
        $stats = [
            'total' => 0,
            'js' => 0,
            'css' => 0,
            'other' => 0,
            'files' => []
        ];
        
        if (is_dir($asset_dir)) {
            $files = scandir($asset_dir);
            foreach ($files as $file) {
                if ($file != '.' && $file != '..') {
                    $stats['total']++;
                    $ext = pathinfo($file, PATHINFO_EXTENSION);
                    if ($ext == 'js') {
                        $stats['js']++;
                    } elseif ($ext == 'css') {
                        $stats['css']++;
                    } else {
                        $stats['other']++;
                    }
                    $stats['files'][] = $file;
                }
            }
        }
        
        return $stats;
    }
    ?>
    
    <h2>1. Vérification des fichiers importants</h2>
    <table>
        <tr>
            <th>Fichier</th>
            <th>Description</th>
            <th>État</th>
            <th>Taille</th>
            <th>Dernière modification</th>
            <th>Lisible</th>
        </tr>
        <?php foreach ($important_files as $file => $description): ?>
            <?php $check = check_file($file); ?>
            <tr>
                <td><?php echo htmlspecialchars($file); ?></td>
                <td><?php echo htmlspecialchars($description); ?></td>
                <td>
                    <?php if ($check['exists']): ?>
                        <span style="color: green">Présent</span>
                    <?php else: ?>
                        <span style="color: red">Manquant</span>
                    <?php endif; ?>
                </td>
                <td><?php echo $check['exists'] ? $check['size'] . ' octets' : '-'; ?></td>
                <td><?php echo $check['exists'] ? $check['time'] : '-'; ?></td>
                <td><?php echo $check['exists'] ? $check['readable'] : '-'; ?></td>
            </tr>
        <?php endforeach; ?>
    </table>
    
    <h2>2. Vérification des fichiers source</h2>
    <table>
        <tr>
            <th>Fichier</th>
            <th>Description</th>
            <th>État</th>
            <th>Taille</th>
            <th>Échantillon de contenu</th>
        </tr>
        <?php foreach ($source_files as $file => $description): ?>
            <?php $check = check_file($file); ?>
            <tr>
                <td><?php echo htmlspecialchars($file); ?></td>
                <td><?php echo htmlspecialchars($description); ?></td>
                <td>
                    <?php if ($check['exists']): ?>
                        <span style="color: green">Présent</span>
                    <?php else: ?>
                        <span style="color: red">Manquant</span>
                    <?php endif; ?>
                </td>
                <td><?php echo $check['exists'] ? $check['size'] . ' octets' : '-'; ?></td>
                <td>
                    <?php if ($check['exists']): ?>
                        <pre style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><?php echo htmlspecialchars($check['content_sample']); ?></pre>
                    <?php else: ?>
                        -
                    <?php endif; ?>
                </td>
            </tr>
        <?php endforeach; ?>
    </table>
    
    <h2>3. Vérification des assets</h2>
    <?php 
    $asset_stats = get_asset_stats();
    if ($asset_stats['total'] > 0): 
    ?>
        <div class="success">
            <p>Il y a un total de <?php echo $asset_stats['total']; ?> fichiers dans le dossier assets:</p>
            <ul>
                <li><?php echo $asset_stats['js']; ?> fichiers JavaScript</li>
                <li><?php echo $asset_stats['css']; ?> fichiers CSS</li>
                <li><?php echo $asset_stats['other']; ?> autres fichiers</li>
            </ul>
        </div>
        
        <table>
            <tr>
                <th>Fichier</th>
                <th>État</th>
                <th>Taille</th>
                <th>Dernière modification</th>
            </tr>
            <?php foreach ($assets as $file => $description): ?>
                <?php $check = check_file($file); ?>
                <tr>
                    <td><?php echo htmlspecialchars($file); ?> (<?php echo htmlspecialchars($description); ?>)</td>
                    <td>
                        <?php if ($check['exists']): ?>
                            <span style="color: green">Présent</span>
                        <?php else: ?>
                            <span style="color: red">Manquant</span>
                        <?php endif; ?>
                    </td>
                    <td><?php echo $check['exists'] ? $check['size'] . ' octets' : '-'; ?></td>
                    <td><?php echo $check['exists'] ? $check['time'] : '-'; ?></td>
                </tr>
            <?php endforeach; ?>
        </table>
        
        <h3>Liste complète des fichiers dans le dossier assets</h3>
        <ul>
            <?php foreach ($asset_stats['files'] as $file): ?>
                <li><?php echo htmlspecialchars($file); ?></li>
            <?php endforeach; ?>
        </ul>
    <?php else: ?>
        <div class="error">
            <p>Aucun fichier trouvé dans le dossier assets!</p>
        </div>
    <?php endif; ?>
    
    <h2>4. Vérification des routes</h2>
    <?php
    $routes = check_route_duplicates();
    if (isset($routes['error'])): ?>
        <div class="error">
            <p><?php echo htmlspecialchars($routes['error']); ?></p>
        </div>
    <?php else: ?>
        <?php
        $duplicates_found = false;
        foreach ($routes as $route => $count) {
            if ($count > 1) {
                $duplicates_found = true;
                break;
            }
        }
        ?>
        
        <?php if ($duplicates_found): ?>
            <div class="error">
                <p>Des routes en double ont été détectées!</p>
            </div>
        <?php else: ?>
            <div class="success">
                <p>Aucune route en double détectée.</p>
            </div>
        <?php endif; ?>
        
        <table>
            <tr>
                <th>Route</th>
                <th>Occurrences</th>
                <th>État</th>
            </tr>
            <?php foreach ($routes as $route => $count): ?>
                <tr>
                    <td><?php echo htmlspecialchars($route); ?></td>
                    <td><?php echo $count; ?></td>
                    <td>
                        <?php if ($count > 1): ?>
                            <span style="color: red">DOUBLON</span>
                        <?php else: ?>
                            <span style="color: green">OK</span>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </table>
    <?php endif; ?>
    
    <h2>Actions</h2>
    <p>
        <?php if (file_exists('api-tools/check-routes.php')): ?>
            <a href="api-tools/check-routes.php" class="button">Vérifier les routes</a>
        <?php endif; ?>
        
        <?php if (file_exists('api-tools/fix-routes.php')): ?>
            <a href="api-tools/fix-routes.php" class="button">Corriger les routes en double</a>
        <?php endif; ?>
        
        <a href="fix-index-assets-simplified.php" class="button">Corriger les références d'assets dans index.html</a>
        <a href="/" class="button">Retour à l'accueil</a>
    </p>
</body>
</html>
