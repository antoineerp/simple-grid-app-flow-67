
<?php
header('Content-Type: text/html; charset=UTF-8');

// Configuration
$baseDir = __DIR__ . '/src';
$mainAppFile = __DIR__ . '/src/App.tsx';

// Fonction pour extraire les routes d'un fichier React Router
function extractRoutes($filePath) {
    if (!file_exists($filePath)) {
        return ['error' => "Fichier non trouvé: $filePath"];
    }
    
    $content = file_get_contents($filePath);
    $routes = [];
    
    // Motifs différents pour les routes React Router
    $patterns = [
        // Format standard: <Route path="/path" element={<Component />} />
        '/<Route[^>]*path=["\']([^"\']*)["\'][^>]*element={[^>]*(?:<|\{)([A-Za-z0-9_]+)(?:\}|\/?>)[^>]*}/', 
        
        // Format avec élément directement: <Route path="/path" element={Component} />
        '/<Route[^>]*path=["\']([^"\']*)["\'][^>]*element=\{([A-Za-z0-9_]+)\}/', 
        
        // Format avec déclaration multi-lignes
        '/<Route[^>]*\n\s*path=["\']([^"\']*)["\'][^>]*\n\s*element={[^>]*(?:<|\{)([A-Za-z0-9_]+)(?:\}|\/?>)[^>]*}/',
        
        // Routes avec Layout ou nested routes
        '/<Route[^>]*path=["\']([^"\']*)["\'][^>]*>[\s\S]*?<\/Route>/'
    ];
    
    foreach ($patterns as $pattern) {
        preg_match_all($pattern, $content, $matches);
        
        if (isset($matches[1]) && count($matches[1]) > 0) {
            for ($i = 0; $i < count($matches[1]); $i++) {
                $path = $matches[1][$i];
                $component = isset($matches[2][$i]) ? $matches[2][$i] : 'Nested/Complex Route';
                
                if (!in_array(['path' => $path, 'component' => $component], $routes)) {
                    $routes[] = [
                        'path' => $path,
                        'component' => $component,
                        'source_file' => $filePath
                    ];
                }
            }
        }
    }
    
    // Recherche des routes avec Outlet (layout routes)
    preg_match_all('/<Route\s+element={[^>]*(?:<|\{)([A-Za-z0-9_]+)(?:\}|\/?>)[^>]*}[^>]*>/', $content, $layoutMatches);
    if (isset($layoutMatches[1]) && count($layoutMatches[1]) > 0) {
        foreach ($layoutMatches[1] as $layout) {
            $routes[] = [
                'path' => 'layout-route',
                'component' => $layout,
                'source_file' => $filePath,
                'type' => 'layout'
            ];
        }
    }
    
    return $routes;
}

// Fonction pour extraire les liens de navigation dans les composants React
function extractNavigationLinks($filePath) {
    if (!file_exists($filePath)) {
        return [];
    }
    
    $content = file_get_contents($filePath);
    $links = [];
    
    // Rechercher les liens <Link to="...">
    preg_match_all('/<Link[^>]*to=["\']([^"\']*)["\'][^>]*>/', $content, $linkMatches);
    if (isset($linkMatches[1]) && count($linkMatches[1]) > 0) {
        foreach ($linkMatches[1] as $link) {
            $links[] = [
                'url' => $link,
                'type' => 'Link',
                'source_file' => $filePath
            ];
        }
    }
    
    // Rechercher les navigate(...) dans useNavigate
    preg_match_all('/navigate\([\'"]([^\'"]*)[\'"]/', $content, $navigateMatches);
    if (isset($navigateMatches[1]) && count($navigateMatches[1]) > 0) {
        foreach ($navigateMatches[1] as $link) {
            $links[] = [
                'url' => $link,
                'type' => 'navigate',
                'source_file' => $filePath
            ];
        }
    }
    
    // Rechercher les liens <a href="..."> (potentiellement problématiques pour SPA)
    preg_match_all('/<a[^>]*href=["\']([^"\']*)["\'][^>]*>/', $content, $aMatches);
    if (isset($aMatches[1]) && count($aMatches[1]) > 0) {
        foreach ($aMatches[1] as $link) {
            // Filtrer les liens externes et les ancres
            if (strpos($link, 'http') !== 0 && strpos($link, '#') !== 0 && $link !== 'javascript:void(0)') {
                $links[] = [
                    'url' => $link,
                    'type' => 'a-tag',
                    'source_file' => $filePath,
                    'warning' => 'Possible SPA navigation issue - consider using Link'
                ];
            }
        }
    }
    
    return $links;
}

// Fonction pour trouver les composants lazy-loaded
function findLazyComponents($filePath) {
    if (!file_exists($filePath)) {
        return [];
    }
    
    $content = file_get_contents($filePath);
    $lazyComponents = [];
    
    // Rechercher les déclarations de composants lazy
    preg_match_all('/const\s+([A-Za-z0-9_]+)\s+=\s+React\.lazy\(\s*\(\)\s*=>\s*import\([\'"]([^\'"]*)[\'"]/', $content, $lazyMatches);
    
    if (isset($lazyMatches[1]) && count($lazyMatches[1]) > 0) {
        for ($i = 0; $i < count($lazyMatches[1]); $i++) {
            $lazyComponents[] = [
                'name' => $lazyMatches[1][$i],
                'path' => $lazyMatches[2][$i],
                'source_file' => $filePath
            ];
        }
    }
    
    return $lazyComponents;
}

// Fonction pour trouver tous les fichiers TypeScript/React dans un répertoire récursivement
function findTsFiles($dir) {
    $results = [];
    if (!is_dir($dir)) {
        return $results;
    }
    
    $files = scandir($dir);
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        $path = $dir . '/' . $file;
        
        if (is_dir($path)) {
            $results = array_merge($results, findTsFiles($path));
        } else {
            if (preg_match('/\.(tsx|ts|jsx|js)$/', $file)) {
                $results[] = $path;
            }
        }
    }
    
    return $results;
}

// Analyser tous les fichiers
$files = findTsFiles($baseDir);
$allRoutes = [];
$allLinks = [];
$allLazyComponents = [];

// Analyser le fichier App.tsx en premier
if (file_exists($mainAppFile)) {
    $mainRoutes = extractRoutes($mainAppFile);
    if (!isset($mainRoutes['error'])) {
        foreach ($mainRoutes as $route) {
            $route['source_file'] = 'App.tsx (Main Router)';
            $allRoutes[] = $route;
        }
    }
    
    $mainLinks = extractNavigationLinks($mainAppFile);
    foreach ($mainLinks as $link) {
        $link['source_file'] = 'App.tsx (Main Router)';
        $allLinks[] = $link;
    }
    
    $mainLazyComponents = findLazyComponents($mainAppFile);
    foreach ($mainLazyComponents as $component) {
        $component['source_file'] = 'App.tsx (Main Router)';
        $allLazyComponents[] = $component;
    }
}

// Analyser tous les autres fichiers
foreach ($files as $file) {
    if ($file === $mainAppFile) continue; // Déjà analysé
    
    $relativeFilePath = str_replace(__DIR__ . '/', '', $file);
    
    $routes = extractRoutes($file);
    if (!isset($routes['error']) && !empty($routes)) {
        foreach ($routes as $route) {
            $route['source_file'] = $relativeFilePath;
            $allRoutes[] = $route;
        }
    }
    
    $links = extractNavigationLinks($file);
    foreach ($links as $link) {
        $link['source_file'] = $relativeFilePath;
        $allLinks[] = $link;
    }
    
    $lazyComponents = findLazyComponents($file);
    foreach ($lazyComponents as $component) {
        $component['source_file'] = $relativeFilePath;
        $allLazyComponents[] = $component;
    }
}

// Vérifier les doublons de routes
$routePaths = [];
$duplicateRoutes = [];

foreach ($allRoutes as $route) {
    $path = $route['path'];
    
    if ($path === 'layout-route') continue; // Ignorer les routes de layout
    
    if (in_array($path, $routePaths)) {
        $duplicateRoutes[] = $path;
    } else {
        $routePaths[] = $path;
    }
}

// Vérifier les liens sans routes correspondantes
$missingRouteLinks = [];
$unusedRoutes = [];

foreach ($allLinks as $link) {
    $url = $link['url'];
    // Ignorer les liens dynamiques et les navigations complexes
    if (strpos($url, ':') !== false || strpos($url, '{') !== false || strpos($url, '*') !== false) {
        continue;
    }
    
    // Vérifier si une route existe pour ce lien
    $hasMatchingRoute = false;
    foreach ($allRoutes as $route) {
        if ($route['path'] === $url || $route['path'] === "/$url" || "/$route[path]" === $url) {
            $hasMatchingRoute = true;
            break;
        }
    }
    
    if (!$hasMatchingRoute) {
        $missingRouteLinks[] = $link;
    }
}

// Vérifier les routes sans liens correspondants
foreach ($allRoutes as $route) {
    if ($route['path'] === 'layout-route' || $route['path'] === '*') {
        continue; // Ignorer les routes de layout et wildcards
    }
    
    $hasLink = false;
    foreach ($allLinks as $link) {
        if ($link['url'] === $route['path'] || $link['url'] === "/$route[path]" || "/$link[url]" === $route['path']) {
            $hasLink = true;
            break;
        }
    }
    
    if (!$hasLink) {
        $unusedRoutes[] = $route;
    }
}

// Vérifier les composants chargés en lazy
$notLazyComponents = [];
foreach ($allRoutes as $route) {
    if ($route['component'] !== 'Nested/Complex Route') {
        $isLazy = false;
        foreach ($allLazyComponents as $lazy) {
            if ($lazy['name'] === $route['component']) {
                $isLazy = true;
                break;
            }
        }
        
        if (!$isLazy) {
            $notLazyComponents[] = $route;
        }
    }
}

// Analyser l'utilisation de A vs Link
$aTags = array_filter($allLinks, function($link) {
    return $link['type'] === 'a-tag';
});

// Générer un rapport HTML
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analyse complète des routes React</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1280px;
            margin: 0 auto;
            padding: 20px;
        }
        
        h1, h2, h3, h4 {
            color: #0066cc;
            margin-top: 1.5em;
        }
        
        .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .section {
            margin-bottom: 30px;
            background-color: #fff;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        th, td {
            padding: 12px 15px;
            border-bottom: 1px solid #ddd;
            text-align: left;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        
        tr:hover {
            background-color: #f8f9fa;
        }
        
        .warning {
            color: #e67e22;
            background-color: #fef9e7;
            border-left: 4px solid #e67e22;
            padding: 10px 15px;
            margin: 15px 0;
        }
        
        .error {
            color: #e74c3c;
            background-color: #fdedec;
            border-left: 4px solid #e74c3c;
            padding: 10px 15px;
            margin: 15px 0;
        }
        
        .success {
            color: #27ae60;
            background-color: #eafaf1;
            border-left: 4px solid #27ae60;
            padding: 10px 15px;
            margin: 15px 0;
        }
        
        .info {
            color: #3498db;
            background-color: #ebf5fb;
            border-left: 4px solid #3498db;
            padding: 10px 15px;
            margin: 15px 0;
        }
        
        .code {
            font-family: monospace;
            background-color: #f8f9fa;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 0.9em;
        }
        
        .file-path {
            font-family: monospace;
            font-size: 0.85em;
            color: #666;
        }
        
        .tabs {
            display: flex;
            border-bottom: 1px solid #ddd;
            margin-bottom: 15px;
        }
        
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: 1px solid transparent;
            border-bottom: none;
        }
        
        .tab.active {
            border-color: #ddd;
            border-bottom-color: white;
            margin-bottom: -1px;
            background-color: white;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .suggestion {
            background-color: #eaf2f8;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 15px 0;
        }
        
        .code-block {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow: auto;
            font-family: monospace;
            white-space: pre-wrap;
        }
        
        .quick-stats {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            flex: 1;
            min-width: 200px;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-card.issues {
            background-color: #fdedec;
            border: 1px solid #e74c3c;
        }
        
        .stat-card.routes {
            background-color: #ebf5fb;
            border: 1px solid #3498db;
        }
        
        .stat-card.links {
            background-color: #eafaf1;
            border: 1px solid #27ae60;
        }
        
        .stat-card.lazy {
            background-color: #fef9e7;
            border: 1px solid #f39c12;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>Analyse complète des routes de l'application React</h1>
    
    <div class="quick-stats">
        <div class="stat-card routes">
            <h3>Routes</h3>
            <div class="stat-number"><?php echo count($allRoutes); ?></div>
            <p>Routes définies dans l'application</p>
        </div>
        
        <div class="stat-card links">
            <h3>Liens</h3>
            <div class="stat-number"><?php echo count($allLinks); ?></div>
            <p>Liens de navigation détectés</p>
        </div>
        
        <div class="stat-card lazy">
            <h3>Composants Lazy</h3>
            <div class="stat-number"><?php echo count($allLazyComponents); ?></div>
            <p>Composants chargés en lazy loading</p>
        </div>
        
        <div class="stat-card issues">
            <h3>Problèmes</h3>
            <div class="stat-number"><?php echo count($duplicateRoutes) + count($missingRouteLinks) + count($unusedRoutes) + count($aTags); ?></div>
            <p>Problèmes potentiels détectés</p>
        </div>
    </div>
    
    <div class="tabs">
        <div class="tab active" onclick="showTab('routes')">Routes</div>
        <div class="tab" onclick="showTab('links')">Navigation</div>
        <div class="tab" onclick="showTab('issues')">Problèmes</div>
        <div class="tab" onclick="showTab('recommendations')">Recommandations</div>
    </div>
    
    <div id="routes" class="tab-content active">
        <div class="section card">
            <h2>Routes définies dans l'application</h2>
            
            <?php if (empty($allRoutes)): ?>
                <div class="warning">
                    <p>Aucune route n'a été détectée dans votre application.</p>
                    <p>Suggestions:</p>
                    <ul>
                        <li>Vérifiez que vous utilisez bien React Router Dom</li>
                        <li>Vérifiez que vos routes sont correctement définies avec le format <span class="code">&lt;Route path="/path" element={&lt;Component /&gt;} /&gt;</span></li>
                        <li>Vérifiez que votre composant Routes est bien rendu dans l'application</li>
                    </ul>
                </div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>Chemin</th>
                            <th>Composant</th>
                            <th>Fichier source</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($allRoutes as $route): ?>
                            <tr>
                                <td class="code"><?php echo htmlspecialchars($route['path']); ?></td>
                                <td class="code"><?php echo htmlspecialchars($route['component']); ?></td>
                                <td class="file-path"><?php echo htmlspecialchars($route['source_file']); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                
                <?php if (!empty($duplicateRoutes)): ?>
                    <div class="error">
                        <h4>Routes en double détectées:</h4>
                        <ul>
                            <?php foreach (array_unique($duplicateRoutes) as $dupRoute): ?>
                                <li class="code"><?php echo htmlspecialchars($dupRoute); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php else: ?>
                    <div class="success">
                        <p>✅ Aucune route en double détectée</p>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
        
        <div class="section card">
            <h2>Composants chargés en lazy loading</h2>
            
            <?php if (empty($allLazyComponents)): ?>
                <div class="warning">
                    <p>Aucun composant chargé en lazy loading n'a été détecté.</p>
                    <p>Le chargement lazy peut améliorer significativement les performances de votre application.</p>
                </div>
                <div class="suggestion">
                    <h4>Suggestion d'utilisation du lazy loading:</h4>
                    <div class="code-block">
// Au lieu de:
import MyComponent from './MyComponent';

// Utilisez:
const MyComponent = React.lazy(() => import('./MyComponent'));

// Et assurez-vous d'envelopper vos routes dans un Suspense:
&lt;Suspense fallback={&lt;div>Chargement...&lt;/div>}>
  &lt;Routes>
    &lt;Route path="/my-path" element={&lt;MyComponent />} />
    ...
  &lt;/Routes>
&lt;/Suspense>
                    </div>
                </div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>Composant</th>
                            <th>Chemin d'importation</th>
                            <th>Fichier source</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($allLazyComponents as $component): ?>
                            <tr>
                                <td class="code"><?php echo htmlspecialchars($component['name']); ?></td>
                                <td class="code"><?php echo htmlspecialchars($component['path']); ?></td>
                                <td class="file-path"><?php echo htmlspecialchars($component['source_file']); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                
                <?php if (count($notLazyComponents) > 0): ?>
                    <div class="warning">
                        <h4>Composants qui pourraient bénéficier du lazy loading:</h4>
                        <ul>
                            <?php foreach ($notLazyComponents as $component): ?>
                                <li>
                                    <span class="code"><?php echo htmlspecialchars($component['component']); ?></span>
                                    <span class="file-path">(utilisé dans <?php echo htmlspecialchars($component['source_file']); ?>)</span>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
    
    <div id="links" class="tab-content">
        <div class="section card">
            <h2>Liens de navigation dans l'application</h2>
            
            <?php if (empty($allLinks)): ?>
                <div class="info">
                    <p>Aucun lien de navigation n'a été détecté dans votre application.</p>
                </div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>URL</th>
                            <th>Type</th>
                            <th>Fichier source</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php 
                        foreach ($allLinks as $link): 
                            // Vérifier si le lien a une route correspondante
                            $hasRoute = false;
                            foreach ($allRoutes as $route) {
                                if ($route['path'] === $link['url'] || $route['path'] === "/$link[url]" || "/$route[path]" === $link['url']) {
                                    $hasRoute = true;
                                    break;
                                }
                            }
                        ?>
                            <tr>
                                <td class="code"><?php echo htmlspecialchars($link['url']); ?></td>
                                <td><?php echo htmlspecialchars($link['type']); ?></td>
                                <td class="file-path"><?php echo htmlspecialchars($link['source_file']); ?></td>
                                <td>
                                    <?php if (isset($link['warning'])): ?>
                                        <span class="warning">⚠️ <?php echo htmlspecialchars($link['warning']); ?></span>
                                    <?php elseif (!$hasRoute): ?>
                                        <span class="error">❌ Pas de route correspondante</span>
                                    <?php else: ?>
                                        <span class="success">✅ OK</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>
    
    <div id="issues" class="tab-content">
        <div class="section card">
            <h2>Problèmes détectés</h2>
            
            <?php if (empty($duplicateRoutes) && empty($missingRouteLinks) && empty($unusedRoutes) && empty($aTags)): ?>
                <div class="success">
                    <p>✅ Aucun problème majeur détecté dans votre configuration de routage!</p>
                </div>
            <?php else: ?>
                <?php if (!empty($duplicateRoutes)): ?>
                    <div class="error">
                        <h3>Routes en double</h3>
                        <p>Les routes suivantes sont définies plusieurs fois, ce qui peut causer des comportements imprévisibles:</p>
                        <ul>
                            <?php foreach (array_unique($duplicateRoutes) as $dupRoute): ?>
                                <li class="code"><?php echo htmlspecialchars($dupRoute); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($missingRouteLinks)): ?>
                    <div class="warning">
                        <h3>Liens sans routes correspondantes</h3>
                        <p>Les liens suivants pointent vers des chemins qui ne semblent pas avoir de routes définies:</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>URL</th>
                                    <th>Type</th>
                                    <th>Fichier source</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($missingRouteLinks as $link): ?>
                                    <tr>
                                        <td class="code"><?php echo htmlspecialchars($link['url']); ?></td>
                                        <td><?php echo htmlspecialchars($link['type']); ?></td>
                                        <td class="file-path"><?php echo htmlspecialchars($link['source_file']); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($unusedRoutes)): ?>
                    <div class="info">
                        <h3>Routes sans liens de navigation</h3>
                        <p>Les routes suivantes sont définies mais ne semblent pas être liées dans l'interface utilisateur:</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Chemin</th>
                                    <th>Composant</th>
                                    <th>Fichier source</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($unusedRoutes as $route): ?>
                                    <tr>
                                        <td class="code"><?php echo htmlspecialchars($route['path']); ?></td>
                                        <td class="code"><?php echo htmlspecialchars($route['component']); ?></td>
                                        <td class="file-path"><?php echo htmlspecialchars($route['source_file']); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($aTags)): ?>
                    <div class="warning">
                        <h3>Utilisation de balises &lt;a&gt; au lieu de &lt;Link&gt;</h3>
                        <p>Les éléments suivants utilisent des balises &lt;a&gt; pour la navigation interne, ce qui peut causer un rechargement complet de la page:</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>URL</th>
                                    <th>Fichier source</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($aTags as $tag): ?>
                                    <tr>
                                        <td class="code"><?php echo htmlspecialchars($tag['url']); ?></td>
                                        <td class="file-path"><?php echo htmlspecialchars($tag['source_file']); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
    
    <div id="recommendations" class="tab-content">
        <div class="section card">
            <h2>Recommandations pour améliorer votre routage</h2>
            
            <div class="suggestion">
                <h3>1. Utiliser le lazy loading pour toutes les routes</h3>
                <p>Le chargement différé des composants de page améliore significativement les performances initiales.</p>
                <div class="code-block">
// Dans App.tsx ou votre fichier principal de routage
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy loading des composants de page
const Home = React.lazy(() => import('./pages/Home'));
const About = React.lazy(() => import('./pages/About'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Chargement...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
                </div>
            </div>
            
            <div class="suggestion">
                <h3>2. Organisation des routes avec layouts</h3>
                <p>Utilisez des layouts partagés pour organiser vos routes de manière plus structurée.</p>
                <div class="code-block">
// Exemple d'utilisation de layouts pour les routes
<Routes>
  {/* Routes publiques */}
  <Route element={<PublicLayout />}>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
  </Route>
  
  {/* Routes protégées */}
  <Route element={<ProtectedLayout />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/profile" element={<Profile />} />
  </Route>
</Routes>
                </div>
            </div>
            
            <div class="suggestion">
                <h3>3. Évitez les routes en double</h3>
                <p>Les définitions de routes en double peuvent entraîner des comportements imprévisibles.</p>
                <?php if (!empty($duplicateRoutes)): ?>
                    <div class="error">
                        <p>Routes à corriger dans votre application:</p>
                        <ul>
                            <?php foreach (array_unique($duplicateRoutes) as $dupRoute): ?>
                                <li class="code"><?php echo htmlspecialchars($dupRoute); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
            </div>
            
            <div class="suggestion">
                <h3>4. Utilisez toujours &lt;Link&gt; au lieu de &lt;a&gt;</h3>
                <p>Les balises &lt;a&gt; causent un rechargement complet de la page, perdant ainsi l'état de votre application.</p>
                <div class="code-block">
// À éviter
<a href="/about">À propos</a>

// Recommandé
import { Link } from 'react-router-dom';
<Link to="/about">À propos</Link>
                </div>
                
                <?php if (!empty($aTags)): ?>
                    <div class="warning">
                        <p>Balises &lt;a&gt; à remplacer dans votre application:</p>
                        <ul>
                            <?php foreach ($aTags as $tag): ?>
                                <li>
                                    <span class="code"><?php echo htmlspecialchars($tag['url']); ?></span>
                                    <span class="file-path">(dans <?php echo htmlspecialchars($tag['source_file']); ?>)</span>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
            </div>
            
            <div class="suggestion">
                <h3>5. Gestion des routes 404</h3>
                <p>Ajoutez toujours une route de fallback pour gérer les URLs inexistantes.</p>
                <div class="code-block">
<Routes>
  {/* Autres routes... */}
  
  {/* Route 404 - doit être la dernière */}
  <Route path="*" element={<NotFound />} />
</Routes>
                </div>
            </div>
        </div>
    </div>
    
    <div class="card">
        <h2>Actions recommandées</h2>
        <?php if (!empty($duplicateRoutes)): ?>
            <div class="error">
                <p><strong>Priorité élevée:</strong> Corriger les routes en double pour éviter des comportements imprévisibles.</p>
            </div>
        <?php endif; ?>
        
        <?php if (!empty($missingRouteLinks)): ?>
            <div class="warning">
                <p><strong>Priorité moyenne:</strong> Ajouter des routes pour les liens sans destination.</p>
            </div>
        <?php endif; ?>
        
        <?php if (count($notLazyComponents) > 0): ?>
            <div class="info">
                <p><strong>Optimisation:</strong> Convertir plus de composants pour utiliser le lazy loading.</p>
            </div>
        <?php endif; ?>
        
        <?php if (!empty($aTags)): ?>
            <div class="warning">
                <p><strong>Amélioration:</strong> Remplacer les balises &lt;a&gt; par des composants &lt;Link&gt; pour la navigation interne.</p>
            </div>
        <?php endif; ?>
        
        <p>
            <strong>Date d'analyse:</strong> <?php echo date('Y-m-d H:i:s'); ?>
        </p>
    </div>
    
    <script>
        function showTab(tabId) {
            // Cacher tous les contenus
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Désactiver tous les onglets
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Afficher le contenu sélectionné
            document.getElementById(tabId).classList.add('active');
            
            // Activer l'onglet cliqué
            event.currentTarget.classList.add('active');
        }
    </script>
</body>
</html>
<?php
// Fin
?>
