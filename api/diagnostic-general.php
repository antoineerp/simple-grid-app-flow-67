
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Centre de Diagnostic FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 1100px; margin: 0 auto; padding: 20px; }
        header { background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        h1 { margin-top: 0; color: #333; }
        .card-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .card { background-color: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .card:hover { transform: translateY(-5px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .card h2 { margin-top: 0; color: #444; font-size: 1.3em; }
        .card p { color: #666; margin-bottom: 20px; height: 80px; }
        .card-icon { font-size: 2.5em; margin-bottom: 10px; color: #4a6da7; }
        .button { display: inline-block; background-color: #4a6da7; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; transition: background-color 0.2s; }
        .button:hover { background-color: #3a5b8c; }
        footer { margin-top: 40px; text-align: center; color: #777; font-size: 0.9em; }
        .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 5px; }
        .status-ok { background-color: #4CAF50; }
        .status-warning { background-color: #FF9800; }
        .status-error { background-color: #F44336; }
        .urgent-card { border: 2px solid #f44336; }
        .priority { font-size: 0.8em; padding: 3px 8px; border-radius: 12px; background-color: #f44336; color: white; margin-left: 5px; position: relative; top: -1px; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Centre de Diagnostic FormaCert</h1>
            <p>Outils de diagnostic et de réparation pour votre déploiement sur Infomaniak</p>
        </header>
        
        <div class="card-container">
            <!-- Réparation d'urgence de index.html -->
            <div class="card urgent-card">
                <div class="card-icon">🚑</div>
                <h2>
                    Réparation d'Urgence <span class="priority">URGENT</span>
                    <?php 
                        $index_ok = false;
                        if (file_exists('../index.html')) {
                            $index_content = file_get_contents('../index.html');
                            // Vérifie que index.html a des références correctes et pas de références à /src/
                            $index_ok = strpos($index_content, 'gptengineer.js') !== false && 
                                      (strpos($index_content, '/assets/main-') !== false || strpos($index_content, '/assets/index') !== false) &&
                                       strpos($index_content, '/src/main') === false;
                        }
                        $status_class = $index_ok ? 'status-ok' : 'status-error';
                        echo "<span class='status-indicator $status_class'></span>";
                    ?>
                </h2>
                <p>Résout l'erreur "Failed to resolve module specifier". Répare les références aux modules ES6 dans index.html.</p>
                <a href="fix-main-references.php" class="button" style="background-color: #f44336;">Accéder</a>
            </div>
            
            <!-- Diagnostic des Assets -->
            <div class="card">
                <div class="card-icon">📦</div>
                <h2>
                    Assets & Références
                    <?php 
                        $has_js_file = file_exists('../assets/main.js') || count(glob('../assets/main-*.js')) > 0;
                        $status_class = $has_js_file ? 'status-ok' : 'status-error';
                        echo "<span class='status-indicator $status_class'></span>";
                    ?>
                </h2>
                <p>Analyse et correction des références aux fichiers JavaScript et CSS compilés dans index.html.</p>
                <a href="fix-main-references.php" class="button">Accéder</a>
            </div>
            
            <!-- Diagnostic de la base de données -->
            <div class="card">
                <div class="card-icon">🔌</div>
                <h2>
                    Connexion Base de Données
                    <?php 
                        $db_ok = false;
                        try {
                            if (file_exists(__DIR__ . '/config/DatabaseConfig.php')) {
                                include_once 'config/DatabaseConfig.php';
                                $db = new DatabaseConfig();
                                $params = $db->getConnectionParams();
                                if (isset($params['db_name']) && $params['db_name'] === 'p71x6d_richard') {
                                    $db_ok = true;
                                }
                            }
                        } catch (Exception $e) {}
                        $status_class = $db_ok ? 'status-ok' : 'status-warning';
                        echo "<span class='status-indicator $status_class'></span>";
                    ?>
                </h2>
                <p>Test et configuration de la connexion à la base de données. Vérifie que la base 'richard' est utilisée.</p>
                <a href="db-connection-test.php" class="button">Accéder</a>
            </div>
            
            <!-- Copie des Assets -->
            <div class="card">
                <div class="card-icon">📝</div>
                <h2>
                    Copie des Assets
                    <?php
                        $dist_exists = is_dir('../dist/assets') && count(glob('../dist/assets/*')) > 0;
                        $status_class = $dist_exists ? 'status-ok' : 'status-warning';
                        echo "<span class='status-indicator $status_class'></span>";
                    ?>
                </h2>
                <p>Copie les fichiers compilés du dossier dist/assets vers assets à la racine du site.</p>
                <a href="../copy-assets.php" class="button">Accéder</a>
            </div>
            
            <!-- Diagnostic des utilisateurs -->
            <div class="card">
                <div class="card-icon">👥</div>
                <h2>
                    Utilisateurs et Rôles
                    <?php 
                        $users_ok = false;
                        try {
                            // Simple test pour vérifier si la table users existe et contient des données
                            if (file_exists(__DIR__ . '/config/DatabaseConfig.php')) {
                                include_once 'config/DatabaseConfig.php';
                                $db = new DatabaseConfig();
                                $pdo = $db->getConnection();
                                if ($pdo) {
                                    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
                                    $users_ok = $stmt && $stmt->rowCount() > 0;
                                }
                            }
                        } catch (Exception $e) {}
                        $status_class = $users_ok ? 'status-ok' : 'status-warning';
                        echo "<span class='status-indicator $status_class'></span>";
                    ?>
                </h2>
                <p>Vérifie la configuration des utilisateurs et des permissions dans la base de données.</p>
                <a href="check-users.php" class="button">Accéder</a>
            </div>
            
            <!-- Informations système -->
            <div class="card">
                <div class="card-icon">🖥️</div>
                <h2>Informations Système</h2>
                <p>Affiche les informations détaillées sur l'environnement PHP et le serveur.</p>
                <a href="info.php" class="button">Accéder</a>
            </div>
            
            <!-- Diagnostic complet -->
            <div class="card">
                <div class="card-icon">🔍</div>
                <h2>Diagnostic Complet</h2>
                <p>Analyse complète de l'installation, incluant tous les aspects techniques.</p>
                <a href="../check-assets-deployment.php" class="button">Accéder</a>
            </div>
            
            <!-- Nouveau vérificateur de référence index.html -->
            <div class="card">
                <div class="card-icon">📄</div>
                <h2>Analyse index.html</h2>
                <p>Analyse détaillée du fichier index.html et vérification des références aux scripts et styles.</p>
                <a href="../index-reference-detector.php" class="button">Accéder</a>
            </div>
        </div>
        
        <footer>
            <p>FormaCert Diagnostic Tools © 2025</p>
        </footer>
    </div>
</body>
</html>

