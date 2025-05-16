
<?php
header('Content-Type: text/html; charset=utf-8');

// Configuration initiale
$github_token = '';
$test_repo = 'antoineerp/qualiopi-ch';
$log_file = 'github-connectivity.log';

// Fonction pour enregistrer les logs
function log_message($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] $message" . PHP_EOL, FILE_APPEND);
}

// Fonction pour tester la connectivité API GitHub
function test_github_api($token = '') {
    $api_url = 'https://api.github.com';
    $headers = ['User-Agent: PHP GitHub Connectivity Test'];
    
    if (!empty($token)) {
        $headers[] = "Authorization: token $token";
    }
    
    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    return [
        'success' => ($http_code >= 200 && $http_code < 300),
        'http_code' => $http_code,
        'response' => $response ? json_decode($response, true) : null,
        'error' => $error
    ];
}

// Fonction pour tester l'accès au dépôt
function test_repo_access($repo, $token = '') {
    $repo_url = "https://api.github.com/repos/$repo";
    $headers = ['User-Agent: PHP GitHub Connectivity Test'];
    
    if (!empty($token)) {
        $headers[] = "Authorization: token $token";
    }
    
    $ch = curl_init($repo_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    return [
        'success' => ($http_code >= 200 && $http_code < 300),
        'http_code' => $http_code,
        'response' => $response ? json_decode($response, true) : null,
        'error' => $error
    ];
}

// Fonction pour tester l'accès au contenu du dépôt
function test_repo_content($repo, $path = '', $token = '') {
    $content_url = "https://api.github.com/repos/$repo/contents" . ($path ? "/$path" : "");
    $headers = ['User-Agent: PHP GitHub Connectivity Test'];
    
    if (!empty($token)) {
        $headers[] = "Authorization: token $token";
    }
    
    $ch = curl_init($content_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    return [
        'success' => ($http_code >= 200 && $http_code < 300),
        'http_code' => $http_code,
        'response' => $response ? json_decode($response, true) : null,
        'error' => $error
    ];
}

// Fonction pour tester l'accès aux commits du dépôt
function test_repo_commits($repo, $token = '') {
    $commits_url = "https://api.github.com/repos/$repo/commits";
    $headers = ['User-Agent: PHP GitHub Connectivity Test'];
    
    if (!empty($token)) {
        $headers[] = "Authorization: token $token";
    }
    
    $ch = curl_init($commits_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    return [
        'success' => ($http_code >= 200 && $http_code < 300),
        'http_code' => $http_code,
        'response' => $response ? json_decode($response, true) : null,
        'error' => $error
    ];
}

// Fonction pour tester les limites d'API
function test_rate_limit($token = '') {
    $rate_url = 'https://api.github.com/rate_limit';
    $headers = ['User-Agent: PHP GitHub Connectivity Test'];
    
    if (!empty($token)) {
        $headers[] = "Authorization: token $token";
    }
    
    $ch = curl_init($rate_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    return [
        'success' => ($http_code >= 200 && $http_code < 300),
        'http_code' => $http_code,
        'response' => $response ? json_decode($response, true) : null,
        'error' => $error
    ];
}

// Traitement du formulaire
$message = '';
$test_results = [];
$status_class = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['github_token'])) {
        $github_token = $_POST['github_token'];
    }
    
    if (isset($_POST['test_repo'])) {
        $test_repo = $_POST['test_repo'];
    }
    
    log_message("Test de connectivité démarré pour le dépôt: $test_repo");
    
    // Test API GitHub
    $api_test = test_github_api($github_token);
    $test_results['api'] = $api_test;
    log_message("Test API GitHub: " . ($api_test['success'] ? 'Réussi' : 'Échoué') . " (HTTP " . $api_test['http_code'] . ")");
    
    if ($api_test['success']) {
        // Test d'accès au dépôt
        $repo_test = test_repo_access($test_repo, $github_token);
        $test_results['repo'] = $repo_test;
        log_message("Test d'accès au dépôt: " . ($repo_test['success'] ? 'Réussi' : 'Échoué') . " (HTTP " . $repo_test['http_code'] . ")");
        
        // Test d'accès au contenu
        $content_test = test_repo_content($test_repo, '', $github_token);
        $test_results['content'] = $content_test;
        log_message("Test d'accès au contenu: " . ($content_test['success'] ? 'Réussi' : 'Échoué') . " (HTTP " . $content_test['http_code'] . ")");
        
        // Test d'accès aux commits
        $commits_test = test_repo_commits($test_repo, $github_token);
        $test_results['commits'] = $commits_test;
        log_message("Test d'accès aux commits: " . ($commits_test['success'] ? 'Réussi' : 'Échoué') . " (HTTP " . $commits_test['http_code'] . ")");
        
        // Test des limites d'API
        $rate_test = test_rate_limit($github_token);
        $test_results['rate'] = $rate_test;
        log_message("Test des limites d'API: " . ($rate_test['success'] ? 'Réussi' : 'Échoué') . " (HTTP " . $rate_test['http_code'] . ")");
        
        // Déterminer le résultat global
        $all_success = $api_test['success'] && $repo_test['success'] && $content_test['success'] && $commits_test['success'] && $rate_test['success'];
        
        if ($all_success) {
            $message = "✅ Tous les tests ont réussi. La connectivité avec GitHub est excellente!";
            $status_class = 'success';
            log_message("Résultat global: Réussi");
        } else {
            $message = "⚠️ Certains tests ont échoué. Vérifiez les détails ci-dessous.";
            $status_class = 'warning';
            log_message("Résultat global: Partiellement échoué");
        }
    } else {
        $message = "❌ Échec de la connexion à l'API GitHub. Vérifiez votre connectivité internet et les détails ci-dessous.";
        $status_class = 'error';
        log_message("Résultat global: Échec");
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test de Connectivité GitHub</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 1000px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"], input[type="password"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #45a049; }
        .success { color: green; padding: 10px; background-color: #f0fff0; border-left: 4px solid green; }
        .warning { color: orange; padding: 10px; background-color: #fffaf0; border-left: 4px solid orange; }
        .error { color: red; padding: 10px; background-color: #fff0f0; border-left: 4px solid red; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; max-height: 300px; }
        .status-indicator { display: inline-block; width: 15px; height: 15px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
        .status-success { background-color: green; }
        .status-error { background-color: red; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f8f8; }
        .tab { display: none; }
        .tab.active { display: block; }
        .tab-links { margin-bottom: 20px; border-bottom: 1px solid #ddd; }
        .tab-link { display: inline-block; padding: 10px 15px; cursor: pointer; background-color: #f1f1f1; border: 1px solid #ddd; border-bottom: none; margin-right: 5px; }
        .tab-link.active { background-color: white; border-bottom: 1px solid white; margin-bottom: -1px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test de Connectivité GitHub</h1>
        
        <?php if (!empty($message)): ?>
            <div class="card <?php echo $status_class; ?>">
                <?php echo $message; ?>
            </div>
        <?php endif; ?>
        
        <div class="card">
            <h2>Configuration du Test</h2>
            <form method="post">
                <div class="form-group">
                    <label for="github_token">Token GitHub (optionnel):</label>
                    <input type="password" id="github_token" name="github_token" value="<?php echo htmlspecialchars($github_token); ?>" placeholder="Entrez votre token GitHub pour augmenter les limites d'API">
                    <small>Laissez vide pour un test sans authentification (limites d'API réduites).</small>
                </div>
                <div class="form-group">
                    <label for="test_repo">Dépôt à tester:</label>
                    <input type="text" id="test_repo" name="test_repo" value="<?php echo htmlspecialchars($test_repo); ?>" placeholder="utilisateur/nom-du-depot">
                </div>
                <button type="submit">Exécuter les Tests</button>
            </form>
        </div>
        
        <?php if (!empty($test_results)): ?>
        <div class="card">
            <h2>Résultats des Tests</h2>
            
            <div class="tab-links">
                <div class="tab-link active" onclick="openTab(event, 'summary-tab')">Résumé</div>
                <div class="tab-link" onclick="openTab(event, 'details-tab')">Détails</div>
                <div class="tab-link" onclick="openTab(event, 'raw-tab')">Données Brutes</div>
            </div>
            
            <div id="summary-tab" class="tab active">
                <table>
                    <tr>
                        <th>Test</th>
                        <th>Statut</th>
                        <th>Code HTTP</th>
                        <th>Message</th>
                    </tr>
                    <tr>
                        <td>Connexion à l'API GitHub</td>
                        <td>
                            <span class="status-indicator <?php echo $test_results['api']['success'] ? 'status-success' : 'status-error'; ?>"></span>
                            <?php echo $test_results['api']['success'] ? 'Réussi' : 'Échoué'; ?>
                        </td>
                        <td><?php echo $test_results['api']['http_code']; ?></td>
                        <td>
                            <?php 
                                if ($test_results['api']['success']) {
                                    echo "Connexion établie avec l'API GitHub";
                                } elseif ($test_results['api']['http_code'] == 403) {
                                    echo "Limite d'API atteinte ou IP bloquée";
                                } elseif ($test_results['api']['error']) {
                                    echo htmlspecialchars($test_results['api']['error']);
                                } else {
                                    echo "Erreur de connexion à l'API";
                                }
                            ?>
                        </td>
                    </tr>
                    <?php if (isset($test_results['repo'])): ?>
                    <tr>
                        <td>Accès au dépôt</td>
                        <td>
                            <span class="status-indicator <?php echo $test_results['repo']['success'] ? 'status-success' : 'status-error'; ?>"></span>
                            <?php echo $test_results['repo']['success'] ? 'Réussi' : 'Échoué'; ?>
                        </td>
                        <td><?php echo $test_results['repo']['http_code']; ?></td>
                        <td>
                            <?php 
                                if ($test_results['repo']['success']) {
                                    echo "Accès au dépôt $test_repo réussi";
                                } elseif ($test_results['repo']['http_code'] == 404) {
                                    echo "Dépôt non trouvé ou accès refusé";
                                } elseif ($test_results['repo']['error']) {
                                    echo htmlspecialchars($test_results['repo']['error']);
                                } else {
                                    echo "Erreur d'accès au dépôt";
                                }
                            ?>
                        </td>
                    </tr>
                    <?php endif; ?>
                    <?php if (isset($test_results['content'])): ?>
                    <tr>
                        <td>Accès au contenu</td>
                        <td>
                            <span class="status-indicator <?php echo $test_results['content']['success'] ? 'status-success' : 'status-error'; ?>"></span>
                            <?php echo $test_results['content']['success'] ? 'Réussi' : 'Échoué'; ?>
                        </td>
                        <td><?php echo $test_results['content']['http_code']; ?></td>
                        <td>
                            <?php 
                                if ($test_results['content']['success']) {
                                    echo "Accès au contenu du dépôt réussi";
                                } elseif ($test_results['content']['http_code'] == 404) {
                                    echo "Contenu non trouvé ou accès refusé";
                                } elseif ($test_results['content']['error']) {
                                    echo htmlspecialchars($test_results['content']['error']);
                                } else {
                                    echo "Erreur d'accès au contenu";
                                }
                            ?>
                        </td>
                    </tr>
                    <?php endif; ?>
                    <?php if (isset($test_results['commits'])): ?>
                    <tr>
                        <td>Accès aux commits</td>
                        <td>
                            <span class="status-indicator <?php echo $test_results['commits']['success'] ? 'status-success' : 'status-error'; ?>"></span>
                            <?php echo $test_results['commits']['success'] ? 'Réussi' : 'Échoué'; ?>
                        </td>
                        <td><?php echo $test_results['commits']['http_code']; ?></td>
                        <td>
                            <?php 
                                if ($test_results['commits']['success']) {
                                    $commit_count = is_array($test_results['commits']['response']) ? count($test_results['commits']['response']) : 0;
                                    echo "Accès réussi à $commit_count commits";
                                } elseif ($test_results['commits']['error']) {
                                    echo htmlspecialchars($test_results['commits']['error']);
                                } else {
                                    echo "Erreur d'accès aux commits";
                                }
                            ?>
                        </td>
                    </tr>
                    <?php endif; ?>
                    <?php if (isset($test_results['rate'])): ?>
                    <tr>
                        <td>Limites d'API</td>
                        <td>
                            <span class="status-indicator <?php echo $test_results['rate']['success'] ? 'status-success' : 'status-error'; ?>"></span>
                            <?php echo $test_results['rate']['success'] ? 'Réussi' : 'Échoué'; ?>
                        </td>
                        <td><?php echo $test_results['rate']['http_code']; ?></td>
                        <td>
                            <?php 
                                if ($test_results['rate']['success'] && isset($test_results['rate']['response']['resources']['core'])) {
                                    $remaining = $test_results['rate']['response']['resources']['core']['remaining'];
                                    $limit = $test_results['rate']['response']['resources']['core']['limit'];
                                    echo "$remaining/$limit requêtes restantes";
                                } elseif ($test_results['rate']['error']) {
                                    echo htmlspecialchars($test_results['rate']['error']);
                                } else {
                                    echo "Erreur d'accès aux limites d'API";
                                }
                            ?>
                        </td>
                    </tr>
                    <?php endif; ?>
                </table>
                
                <h3>Implications pour les Workflows GitHub</h3>
                <?php if (isset($test_results['api']) && $test_results['api']['success'] && 
                          isset($test_results['repo']) && $test_results['repo']['success'] && 
                          isset($test_results['content']) && $test_results['content']['success']): ?>
                <div class="success">
                    <p>✅ <strong>Votre serveur peut communiquer correctement avec GitHub.</strong></p>
                    <p>Les workflows et webhooks GitHub devraient fonctionner comme prévu.</p>
                </div>
                <?php else: ?>
                <div class="error">
                    <p>❌ <strong>Votre serveur rencontre des problèmes pour communiquer avec GitHub.</strong></p>
                    <p>Les workflows et webhooks GitHub pourraient ne pas fonctionner correctement en raison de ces problèmes.</p>
                    <p>Vérifiez les points suivants:</p>
                    <ul>
                        <li>La connexion internet du serveur</li>
                        <li>Les pare-feu qui pourraient bloquer les connexions sortantes</li>
                        <li>L'accès à l'API GitHub depuis votre serveur</li>
                        <li>Les permissions du token GitHub (si utilisé)</li>
                    </ul>
                </div>
                <?php endif; ?>
            </div>
            
            <div id="details-tab" class="tab">
                <h3>Détails des Tests</h3>
                
                <?php if (isset($test_results['api'])): ?>
                <h4>1. Connexion à l'API GitHub</h4>
                <p><strong>URL testée:</strong> https://api.github.com</p>
                <p><strong>Statut:</strong> <?php echo $test_results['api']['success'] ? 'Réussi' : 'Échoué'; ?></p>
                <p><strong>Code HTTP:</strong> <?php echo $test_results['api']['http_code']; ?></p>
                <?php if (!$test_results['api']['success']): ?>
                <div class="error">
                    <p><strong>Problème potentiel:</strong></p>
                    <?php if ($test_results['api']['http_code'] == 403): ?>
                    <ul>
                        <li>Limite d'API GitHub atteinte</li>
                        <li>Votre adresse IP pourrait être bloquée</li>
                        <li>Un pare-feu pourrait bloquer les requêtes</li>
                    </ul>
                    <p><strong>Solutions:</strong></p>
                    <ul>
                        <li>Utilisez un token GitHub pour augmenter votre limite d'API</li>
                        <li>Vérifiez que votre serveur peut accéder à internet</li>
                        <li>Vérifiez les règles de pare-feu sur votre serveur</li>
                    </ul>
                    <?php elseif ($test_results['api']['error']): ?>
                    <p><?php echo htmlspecialchars($test_results['api']['error']); ?></p>
                    <?php else: ?>
                    <p>Erreur non spécifiée lors de la connexion à l'API GitHub.</p>
                    <?php endif; ?>
                </div>
                <?php endif; ?>
                <?php endif; ?>
                
                <?php if (isset($test_results['rate']) && $test_results['rate']['success'] && isset($test_results['rate']['response']['resources'])): ?>
                <h4>Limites d'API GitHub</h4>
                <table>
                    <tr>
                        <th>Ressource</th>
                        <th>Restant</th>
                        <th>Limite</th>
                        <th>Reset dans</th>
                    </tr>
                    <?php foreach ($test_results['rate']['response']['resources'] as $resource => $data): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($resource); ?></td>
                        <td><?php echo $data['remaining']; ?></td>
                        <td><?php echo $data['limit']; ?></td>
                        <td>
                            <?php 
                                if (isset($data['reset'])) {
                                    $reset_time = new DateTime('@' . $data['reset']);
                                    $now = new DateTime();
                                    $diff = $reset_time->diff($now);
                                    echo $diff->format('%h heures, %i minutes, %s secondes');
                                } else {
                                    echo 'N/A';
                                }
                            ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </table>
                <?php endif; ?>
            </div>
            
            <div id="raw-tab" class="tab">
                <h3>Données Brutes</h3>
                <pre><?php print_r($test_results); ?></pre>
            </div>
        </div>
        
        <div class="card">
            <h2>Tests Supplémentaires</h2>
            
            <h3>Test des Workflows GitHub</h3>
            <p>Pour vérifier que vos workflows GitHub sont correctement configurés:</p>
            <ol>
                <li>Accédez à votre dépôt sur GitHub</li>
                <li>Allez dans l'onglet "Actions"</li>
                <li>Vérifiez que vos workflows sont bien listés</li>
                <li>Cliquez sur "Run workflow" pour déclencher manuellement un workflow</li>
            </ol>
            
            <h3>Test des Webhooks GitHub</h3>
            <p>Pour vérifier que vos webhooks GitHub sont correctement configurés:</p>
            <ol>
                <li>Accédez à votre dépôt sur GitHub</li>
                <li>Allez dans "Settings" puis "Webhooks"</li>
                <li>Cliquez sur votre webhook</li>
                <li>Vérifiez les "Recent Deliveries" pour voir l'historique des requêtes</li>
                <li>Utilisez le bouton "Redeliver" pour renvoyer une requête précédente</li>
            </ol>
            
            <p>
                <a href="selective-github-webhook.php" style="display: inline-block; margin-right: 10px; padding: 8px 16px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
                    Configurer le Webhook Sélectif
                </a>
                <a href="update-github-workflow.php" style="display: inline-block; padding: 8px 16px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px;">
                    Gérer les Workflows GitHub
                </a>
            </p>
        </div>
        <?php endif; ?>
    </div>
    
    <script>
        function openTab(evt, tabName) {
            // Declare all variables
            var i, tabs, tabLinks;

            // Get all elements with class="tab" and hide them
            tabs = document.getElementsByClassName("tab");
            for (i = 0; i < tabs.length; i++) {
                tabs[i].classList.remove("active");
            }

            // Get all elements with class="tab-link" and remove the class "active"
            tabLinks = document.getElementsByClassName("tab-link");
            for (i = 0; i < tabLinks.length; i++) {
                tabLinks[i].classList.remove("active");
            }

            // Show the current tab, and add an "active" class to the button that opened the tab
            document.getElementById(tabName).classList.add("active");
            evt.currentTarget.classList.add("active");
        }
    </script>
</body>
</html>
