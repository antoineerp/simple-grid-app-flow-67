
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour analyser App.tsx et extraire les routes définies
function extractRoutesFromAppTsx() {
    $filepath = __DIR__ . '/src/App.tsx';
    
    if (!file_exists($filepath)) {
        return ['error' => "Fichier App.tsx introuvable dans " . __DIR__];
    }
    
    $content = file_get_contents($filepath);
    $routes = [];
    
    // Rechercher les routes dans App.tsx
    preg_match_all('/<Route\s+path=[\'"]([^\'"]*)[\'"]/', $content, $matches);
    
    if (!empty($matches[1])) {
        foreach ($matches[1] as $route) {
            $routes[] = $route;
        }
    }
    
    // Rechercher également les redirections
    preg_match_all('/<Navigate\s+to=[\'"]([^\'"]*)[\'"]/', $content, $matches);
    
    if (!empty($matches[1])) {
        foreach ($matches[1] as $route) {
            $routes[] = $route;
        }
    }
    
    return array_unique($routes);
}

// Fonction pour analyser les fichiers de navigation (comme SidebarConfig)
function extractNavigationLinks() {
    $filepaths = [
        __DIR__ . '/src/components/sidebar/sidebarConfig.tsx',
        __DIR__ . '/src/components/Header.tsx'
    ];
    
    $links = [];
    
    foreach ($filepaths as $filepath) {
        if (!file_exists($filepath)) {
            continue;
        }
        
        $content = file_get_contents($filepath);
        
        // Chercher les définitions de chemins dans les configs
        preg_match_all('/path:\s*[\'"]([^\'"]*)[\'"]/', $content, $matches);
        
        if (!empty($matches[1])) {
            foreach ($matches[1] as $link) {
                $links[] = $link;
            }
        }
        
        // Chercher les liens dans Link ou NavLink
        preg_match_all('/(?:Link|NavLink)[^>]*to=[\'"]([^\'"]*)[\'"]/', $content, $matches);
        
        if (!empty($matches[1])) {
            foreach ($matches[1] as $link) {
                $links[] = $link;
            }
        }
    }
    
    return array_unique($links);
}

// Fonction pour vérifier la cohérence entre les routes déclarées et les liens utilisés
function checkRouteConsistency($routes, $links) {
    $inconsistencies = [];
    
    foreach ($links as $link) {
        // Ignorer les liens externes ou à l'ancre
        if (strpos($link, 'http') === 0 || strpos($link, '#') === 0) {
            continue;
        }
        
        $linkPath = parse_url($link, PHP_URL_PATH) ?: $link;
        
        // Vérifier si ce lien correspond à une route définie
        $found = false;
        foreach ($routes as $route) {
            $routePattern = str_replace('*', '.*', $route);
            if ($route === $linkPath || 
                preg_match('#^' . $routePattern . '$#', $linkPath) || 
                $route === '*') {
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            $inconsistencies[] = $linkPath;
        }
    }
    
    return $inconsistencies;
}

// Exécution principale
$routes = extractRoutesFromAppTsx();
$navLinks = extractNavigationLinks();

// Vérifier les doublons dans les routes
$routeCounts = array_count_values($routes);
$duplicateRoutes = array_filter($routeCounts, function($count) {
    return $count > 1;
});

// Vérifier les incohérences
$missingRoutes = checkRouteConsistency($routes, $navLinks);

// Générer le rapport
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Diagnostic des Routes</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 {
            color: #333;
        }
        .card {
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
            background-color: #f9f9f9;
        }
        .info {
            background-color: #e8f4f8;
            border-left: 5px solid #5bc0de;
            padding: 10px;
            margin: 10px 0;
        }
        .warning {
            background-color: #fcf8e3;
            border-left: 5px solid #f0ad4e;
            padding: 10px;
            margin: 10px 0;
        }
        .error {
            background-color: #f2dede;
            border-left: 5px solid #d9534f;
            padding: 10px;
            margin: 10px 0;
        }
        .success {
            background-color: #dff0d8;
            border-left: 5px solid #5cb85c;
            padding: 10px;
            margin: 10px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>
    <h1>Diagnostic des Routes de l'Application</h1>
    
    <?php if (isset($routes['error'])): ?>
        <div class="error">
            <h3>Erreur lors de l'analyse</h3>
            <p><?php echo htmlspecialchars($routes['error']); ?></p>
        </div>
    <?php else: ?>
    
        <div class="card">
            <h2>Routes définies dans App.tsx</h2>
            <?php if (empty($routes)): ?>
                <div class="warning">
                    <p>Aucune route trouvée dans App.tsx.</p>
                </div>
            <?php else: ?>
                <table>
                    <tr>
                        <th>Route</th>
                    </tr>
                    <?php foreach ($routes as $route): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($route); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </table>
                <p>Total: <?php echo count($routes); ?> routes définies.</p>
            <?php endif; ?>
        </div>
        
        <div class="card">
            <h2>Liens de navigation</h2>
            <?php if (empty($navLinks)): ?>
                <div class="warning">
                    <p>Aucun lien de navigation trouvé.</p>
                </div>
            <?php else: ?>
                <table>
                    <tr>
                        <th>Chemin</th>
                    </tr>
                    <?php foreach ($navLinks as $link): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($link); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </table>
                <p>Total: <?php echo count($navLinks); ?> liens de navigation.</p>
            <?php endif; ?>
        </div>
        
        <div class="card">
            <h2>Analyse des problèmes</h2>
            
            <?php if (!empty($duplicateRoutes)): ?>
                <div class="error">
                    <h3>Routes définies plusieurs fois</h3>
                    <table>
                        <tr>
                            <th>Route</th>
                            <th>Nombre d'occurrences</th>
                        </tr>
                        <?php foreach ($duplicateRoutes as $route => $count): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($route); ?></td>
                            <td><?php echo $count; ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </table>
                </div>
            <?php else: ?>
                <div class="success">
                    <p>Aucune route en double détectée. ✓</p>
                </div>
            <?php endif; ?>
            
            <?php if (!empty($missingRoutes)): ?>
                <div class="warning">
                    <h3>Liens de navigation sans route correspondante</h3>
                    <ul>
                        <?php foreach ($missingRoutes as $route): ?>
                        <li><?php echo htmlspecialchars($route); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php else: ?>
                <div class="success">
                    <p>Tous les liens de navigation correspondent à des routes définies. ✓</p>
                </div>
            <?php endif; ?>
        </div>
        
        <div class="card">
            <h2>Recommandations</h2>
            <ul>
                <?php if (!empty($duplicateRoutes)): ?>
                <li>Éliminez les routes en double dans App.tsx pour éviter les comportements inattendus.</li>
                <?php endif; ?>
                
                <?php if (!empty($missingRoutes)): ?>
                <li>Ajoutez des définitions de route pour les liens de navigation qui n'ont pas de route correspondante.</li>
                <?php endif; ?>
                
                <?php if (empty($duplicateRoutes) && empty($missingRoutes)): ?>
                <div class="success">
                    <p>Votre configuration de routage semble correcte! ✓</p>
                </div>
                <?php endif; ?>
            </ul>
        </div>
        
    <?php endif; ?>
    
    <p>
        <a href="/check-build-status.php">Vérifier l'état du build</a> | 
        <a href="/fix-missing-files.php">Corriger les fichiers manquants</a> |
        <a href="/fix-index-assets-simplified.php">Réparer les références CSS/JS</a>
    </p>
</body>
</html>
<?php
// EOF
?>
