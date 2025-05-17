
<?php
// Fonction pour analyser un fichier et extraire les composantes de routage
function analyzeRouting($filePath) {
    if (!file_exists($filePath)) {
        return [
            'status' => 'error',
            'message' => "Fichier non trouvé: $filePath"
        ];
    }
    
    $content = file_get_contents($filePath);
    $result = [
        'file' => $filePath,
        'routes' => [],
        'imports' => [],
        'lazyComponents' => []
    ];
    
    // Extraire les routes
    preg_match_all('/<Route[^>]*path=[\'"]([^\'"]*)[\'"][^>]*element={<?[^>]*(<|\{)([A-Za-z0-9_]+)(\}|\/?>)[^>]*}/', $content, $routeMatches);
    if (!empty($routeMatches[1])) {
        for ($i = 0; $i < count($routeMatches[1]); $i++) {
            $result['routes'][] = [
                'path' => $routeMatches[1][$i],
                'component' => isset($routeMatches[3][$i]) ? $routeMatches[3][$i] : null
            ];
        }
    }
    
    // Extraire les imports
    preg_match_all('/import\s+(\{[^}]*\}|\w+)\s+from\s+[\'"]([^\'"]*)[\'"];/', $content, $importMatches);
    if (!empty($importMatches[1])) {
        for ($i = 0; $i < count($importMatches[1]); $i++) {
            $result['imports'][] = [
                'what' => $importMatches[1][$i],
                'from' => $importMatches[2][$i]
            ];
        }
    }
    
    // Extraire les composants chargés en lazy
    preg_match_all('/const\s+(\w+)\s+=\s+React\.lazy\(\s*\(\)\s*=>\s*import\([\'"]([^\'"]*)[\'"]/', $content, $lazyMatches);
    if (!empty($lazyMatches[1])) {
        for ($i = 0; $i < count($lazyMatches[1]); $i++) {
            $result['lazyComponents'][] = [
                'name' => $lazyMatches[1][$i],
                'path' => $lazyMatches[2][$i]
            ];
        }
    }
    
    return [
        'status' => 'success',
        'data' => $result
    ];
}

// Analyser App.tsx pour comprendre la structure de routage
$appRoutingAnalysis = analyzeRouting(__DIR__ . '/src/App.tsx');

// Fonction pour générer un rapport HTML
function generateReport($analysis) {
    ob_start();
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Vérification des routes de l'application</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            h1, h2, h3 {
                color: #1a1a1a;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            th, td {
                padding: 10px;
                border: 1px solid #ddd;
                text-align: left;
            }
            th {
                background-color: #f5f5f5;
            }
            tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .error {
                color: #d9534f;
                font-weight: bold;
            }
            .warning {
                color: #f0ad4e;
            }
            .success {
                color: #5cb85c;
            }
            .code {
                font-family: monospace;
                background-color: #f5f5f5;
                padding: 2px 4px;
                border-radius: 3px;
            }
        </style>
    </head>
    <body>
        <h1>Vérification des routes de l'application</h1>
        
        <?php if ($analysis['status'] === 'error'): ?>
            <div class="error"><?php echo $analysis['message']; ?></div>
        <?php else: ?>
            <h2>Structure de routage dans <?php echo basename($analysis['data']['file']); ?></h2>
            
            <h3>Routes définies</h3>
            <?php if (empty($analysis['data']['routes'])): ?>
                <p class="warning">Aucune route trouvée.</p>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>Chemin</th>
                            <th>Composant</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($analysis['data']['routes'] as $route): ?>
                            <tr>
                                <td class="code"><?php echo htmlspecialchars($route['path']); ?></td>
                                <td class="code"><?php echo htmlspecialchars($route['component'] ?? 'Non identifié'); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                
                <?php 
                // Vérifier les doublons de routes
                $paths = array_column($analysis['data']['routes'], 'path');
                $duplicatePaths = array_filter(array_count_values($paths), function($count) { return $count > 1; });
                
                if (!empty($duplicatePaths)):
                ?>
                    <h3 class="error">Routes en double détectées!</h3>
                    <ul>
                        <?php foreach ($duplicatePaths as $path => $count): ?>
                            <li class="error">
                                <span class="code"><?php echo htmlspecialchars($path); ?></span> apparaît <?php echo $count; ?> fois
                            </li>
                        <?php endforeach; ?>
                    </ul>
                <?php else: ?>
                    <p class="success">Aucune route en double détectée.</p>
                <?php endif; ?>
            <?php endif; ?>
            
            <h3>Composants chargés en lazy (code splitting)</h3>
            <?php if (empty($analysis['data']['lazyComponents'])): ?>
                <p class="warning">Aucun composant lazy trouvé.</p>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>Nom du composant</th>
                            <th>Chemin d'importation</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($analysis['data']['lazyComponents'] as $component): ?>
                            <tr>
                                <td class="code"><?php echo htmlspecialchars($component['name']); ?></td>
                                <td class="code"><?php echo htmlspecialchars($component['path']); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
            
            <h3>Imports utilisés</h3>
            <?php if (empty($analysis['data']['imports'])): ?>
                <p class="warning">Aucun import trouvé.</p>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>Import</th>
                            <th>Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($analysis['data']['imports'] as $import): ?>
                            <tr>
                                <td class="code"><?php echo htmlspecialchars($import['what']); ?></td>
                                <td class="code"><?php echo htmlspecialchars($import['from']); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
            
            <h2>Recommandations</h2>
            <ul>
                <?php if (!empty($duplicatePaths)): ?>
                    <li class="error">
                        Corrigez les routes en double pour éviter des comportements imprévisibles.
                    </li>
                <?php endif; ?>
                
                <?php
                // Vérifier que tous les composants de route sont bien importés
                $routeComponents = array_filter(array_column($analysis['data']['routes'], 'component'));
                $importedComponents = [];
                foreach ($analysis['data']['imports'] as $import) {
                    if (preg_match('/\{([^}]+)\}/', $import['what'], $matches)) {
                        $components = explode(',', $matches[1]);
                        foreach ($components as $component) {
                            $importedComponents[] = trim($component);
                        }
                    } else {
                        $importedComponents[] = trim($import['what']);
                    }
                }
                
                // Ajouter les composants lazy
                $lazyComponents = array_column($analysis['data']['lazyComponents'], 'name');
                $allImportedComponents = array_merge($importedComponents, $lazyComponents);
                
                $missingImports = array_diff($routeComponents, $allImportedComponents);
                if (!empty($missingImports)):
                ?>
                    <li class="error">
                        Composants utilisés dans les routes mais non importés:
                        <ul>
                            <?php foreach ($missingImports as $missing): ?>
                                <li class="code"><?php echo htmlspecialchars($missing); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </li>
                <?php endif; ?>
                
                <li class="success">
                    Utilisez toujours React.lazy pour les routes pour améliorer les performances de chargement.
                </li>
                <li>
                    Assurez-vous que vos routes sont cohérentes avec votre navigation (menus, liens, etc.).
                </li>
            </ul>
        <?php endif; ?>
        
        <p>
            <strong>Date de vérification:</strong> <?php echo date('Y-m-d H:i:s'); ?>
        </p>
    </body>
    </html>
    <?php
    return ob_get_clean();
}

// Générer et afficher le rapport
echo generateReport($appRoutingAnalysis);
?>
