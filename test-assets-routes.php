
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test des Assets et Routes</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; background-color: #f0fff0; padding: 10px; margin: 5px 0; border-left: 4px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; margin: 5px 0; border-left: 4px solid red; }
        .warning { color: orange; background-color: #fffaf0; padding: 10px; margin: 5px 0; border-left: 4px solid orange; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .btn { background-color: #4CAF50; border: none; color: white; padding: 10px 15px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test des Assets et Routes</h1>
        
        <div class="card">
            <h2>Vérification de l'état des fichiers</h2>
            <?php
            // Fonction pour vérifier la présence des fichiers CSS et JS compilés
            function checkCompiledAssets() {
                $results = [
                    'css' => ['found' => false, 'path' => null, 'count' => 0],
                    'js' => ['found' => false, 'path' => null, 'count' => 0],
                    'dist_css' => ['found' => false, 'path' => null, 'count' => 0],
                    'dist_js' => ['found' => false, 'path' => null, 'count' => 0]
                ];
                
                // Vérifier dans /assets/
                $css_files = glob('./assets/*.css');
                if (!empty($css_files)) {
                    $results['css']['found'] = true;
                    $results['css']['path'] = './assets/';
                    $results['css']['count'] = count($css_files);
                    $results['css']['files'] = array_slice($css_files, 0, 5); // Limiter à 5 fichiers
                }
                
                $js_files = glob('./assets/*.js');
                if (!empty($js_files)) {
                    $results['js']['found'] = true;
                    $results['js']['path'] = './assets/';
                    $results['js']['count'] = count($js_files);
                    $results['js']['files'] = array_slice($js_files, 0, 5); // Limiter à 5 fichiers
                }
                
                // Vérifier dans /dist/assets/
                if (is_dir('./dist/assets')) {
                    $dist_css_files = glob('./dist/assets/*.css');
                    if (!empty($dist_css_files)) {
                        $results['dist_css']['found'] = true;
                        $results['dist_css']['path'] = './dist/assets/';
                        $results['dist_css']['count'] = count($dist_css_files);
                        $results['dist_css']['files'] = array_slice($dist_css_files, 0, 5); // Limiter à 5 fichiers
                    }
                    
                    $dist_js_files = glob('./dist/assets/*.js');
                    if (!empty($dist_js_files)) {
                        $results['dist_js']['found'] = true;
                        $results['dist_js']['path'] = './dist/assets/';
                        $results['dist_js']['count'] = count($dist_js_files);
                        $results['dist_js']['files'] = array_slice($dist_js_files, 0, 5); // Limiter à 5 fichiers
                    }
                }
                
                return $results;
            }
            
            $assets_status = checkCompiledAssets();
            ?>
            
            <h3>Fichiers compilés</h3>
            <ul>
                <li>Fichiers CSS dans /assets/: 
                    <?php if ($assets_status['css']['found']): ?>
                        <span class="success">Trouvés (<?php echo $assets_status['css']['count']; ?>)</span>
                        <ul>
                            <?php foreach ($assets_status['css']['files'] as $file): ?>
                                <li><?php echo basename($file); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    <?php else: ?>
                        <span class="error">Non trouvés</span>
                    <?php endif; ?>
                </li>
                
                <li>Fichiers JavaScript dans /assets/: 
                    <?php if ($assets_status['js']['found']): ?>
                        <span class="success">Trouvés (<?php echo $assets_status['js']['count']; ?>)</span>
                        <ul>
                            <?php foreach ($assets_status['js']['files'] as $file): ?>
                                <li><?php echo basename($file); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    <?php else: ?>
                        <span class="error">Non trouvés</span>
                    <?php endif; ?>
                </li>
                
                <li>Fichiers CSS dans /dist/assets/: 
                    <?php if ($assets_status['dist_css']['found']): ?>
                        <span class="success">Trouvés (<?php echo $assets_status['dist_css']['count']; ?>)</span>
                        <ul>
                            <?php foreach ($assets_status['dist_css']['files'] as $file): ?>
                                <li><?php echo basename($file); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    <?php else: ?>
                        <span class="error">Non trouvés</span>
                    <?php endif; ?>
                </li>
                
                <li>Fichiers JavaScript dans /dist/assets/: 
                    <?php if ($assets_status['dist_js']['found']): ?>
                        <span class="success">Trouvés (<?php echo $assets_status['dist_js']['count']; ?>)</span>
                        <ul>
                            <?php foreach ($assets_status['dist_js']['files'] as $file): ?>
                                <li><?php echo basename($file); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    <?php else: ?>
                        <span class="error">Non trouvés</span>
                    <?php endif; ?>
                </li>
            </ul>
        </div>
        
        <div class="card">
            <h2>Vérification des routes</h2>
            <?php
            // Fonction pour vérifier la réponse d'une route
            function checkRoute($route) {
                $url = $route;
                if (!preg_match('/^https?:\/\//', $route)) {
                    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
                    $host = $_SERVER['HTTP_HOST'];
                    $url = "$protocol://$host" . (substr($route, 0, 1) === '/' ? $route : "/$route");
                }
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HEADER, true);
                curl_setopt($ch, CURLOPT_NOBODY, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
                curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                return ['route' => $route, 'status' => $httpCode];
            }
            
            // Liste des routes à vérifier
            $routes = [
                '/', 
                '/index.html',
                '/pilotage', 
                '/administration',
                '/db-admin',
                '/server-test',
                '/user-management'
            ];
            
            // Vérifier chaque route
            if (isset($_GET['check_routes'])) {
                echo "<h3>Résultats du test des routes</h3><ul>";
                foreach ($routes as $route) {
                    $result = checkRoute($route);
                    echo "<li>Route <code>" . htmlspecialchars($route) . "</code>: ";
                    if ($result['status'] >= 200 && $result['status'] < 400) {
                        echo "<span class='success'>OK (" . $result['status'] . ")</span>";
                    } else {
                        echo "<span class='error'>Erreur (" . $result['status'] . ")</span>";
                    }
                    echo "</li>";
                }
                echo "</ul>";
            } else {
                echo "<form method='get'>";
                echo "<p>Cliquez sur le bouton ci-dessous pour tester l'accès aux routes principales de l'application:</p>";
                echo "<button type='submit' name='check_routes' value='1' class='btn'>Tester les routes</button>";
                echo "</form>";
            }
            ?>
        </div>
        
        <div class="card">
            <h2>Solutions et liens utiles</h2>
            <p>Pour résoudre les problèmes courants:</p>
            <ul>
                <li><a href="fix-index-html.php" class="btn">Corriger index.html</a> - Met à jour les références aux fichiers CSS et JS dans index.html</li>
                <li><a href="copy-assets.php" class="btn">Copier les assets depuis dist/</a> - Copie les fichiers compilés de dist/assets/ vers /assets/</li>
                <li><a href="fix-assets-runtime.php" class="btn">Corriger les assets à l'exécution</a> - Correction dynamique des références à l'exécution</li>
                <li><a href="check-deployment-issues.php" class="btn">Vérifier problèmes de déploiement</a> - Diagnostic complet du déploiement</li>
            </ul>
            
            <h3>Configuration GitHub Workflow</h3>
            <p>Si le fichier CSS principal n'est pas trouvé dans dist/, il faut s'assurer que votre workflow GitHub:</p>
            <ol>
                <li>Exécute correctement <code>npm run build</code> pour générer les fichiers</li>
                <li>Transfère efficacement le dossier <code>dist</code> ou <code>dist/assets</code> vers votre serveur</li>
                <li>Ne filtre pas les fichiers CSS lors du transfert FTP</li>
            </ol>
            <p><strong>Exemple de GitHub Workflow corrigé:</strong></p>
            <pre>
name: Deploy to Infomaniak

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install Dependencies
      run: npm install
      
    - name: Build React App
      run: npm run build
      
    - name: Debug build output
      run: |
        echo "Contenu du dossier dist:"
        ls -la dist/
        echo "Contenu du dossier dist/assets:"
        ls -la dist/assets/
        
    - name: FTP Deploy to Infomaniak
      uses: SamKirkland/FTP-Deploy-Action@v4.3.4
      with:
        server: ${{ secrets.FTP_SERVER }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        local-dir: ./dist/
        server-dir: /sites/votre-site/dist/
        dangerous-clean-slate: false
</pre>
        </div>
        
    </div>
</body>
</html>
