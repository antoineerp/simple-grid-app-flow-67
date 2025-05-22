
<?php
// Désactiver la mise en cache
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API - Points d'entrée disponibles</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1, h2 { color: #333; }
        .endpoint { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .endpoint h3 { margin-top: 0; }
        .method { display: inline-block; padding: 3px 6px; border-radius: 3px; color: white; font-size: 12px; margin-right: 5px; }
        .get { background-color: #61affe; }
        .post { background-color: #49cc90; }
        .put { background-color: #fca130; }
        .delete { background-color: #f93e3e; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .actions { margin-top: 10px; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>API - Points d'entrée disponibles</h1>
    
    <p>Cette page liste les points d'entrée API disponibles pour le débogage et les tests.</p>
    
    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/php-test.php</h3>
        <p>Test simple pour vérifier si PHP fonctionne correctement.</p>
        <div class="actions">
            <a href="php-test.php" target="_blank">Tester</a>
        </div>
    </div>
    
    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/check-users.php</h3>
        <p>Vérifier l'état des utilisateurs dans la base de données.</p>
        <div class="actions">
            <a href="check-users.php" target="_blank">Tester</a>
        </div>
    </div>
    
    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/diagnose-connection.php</h3>
        <p>Diagnostic complet de la configuration du serveur.</p>
        <div class="actions">
            <a href="diagnose-connection.php" target="_blank">Tester</a>
        </div>
    </div>
    
    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/mock-users.json</h3>
        <p>Données JSON simulées pour les utilisateurs (utilisées en cas d'échec des API PHP).</p>
        <div class="actions">
            <a href="mock-users.json" target="_blank">Voir</a>
        </div>
    </div>
    
    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/users.php</h3>
        <p>Récupération des utilisateurs (contrôleur principal).</p>
        <div class="actions">
            <a href="users.php" target="_blank">Tester</a>
        </div>
    </div>
    
    <h2>Outils de diagnostic</h2>
    
    <div class="endpoint">
        <h3>Diagnostic du serveur PHP</h3>
        <p>Vérification complète du serveur PHP et des connexions.</p>
        <div class="actions">
            <a href="diagnose-connection.php" target="_blank">Exécuter le diagnostic</a>
        </div>
    </div>
    
    <h2>Informations PHP</h2>
    
    <div class="endpoint">
        <?php 
        $php_version = phpversion();
        $extensions = get_loaded_extensions();
        $json_enabled = in_array('json', $extensions);
        $pdo_enabled = in_array('pdo', $extensions);
        $mysql_enabled = in_array('pdo_mysql', $extensions);
        ?>
        <h3>Configuration PHP</h3>
        <ul>
            <li>Version PHP: <?php echo $php_version; ?></li>
            <li>Support JSON: <?php echo $json_enabled ? '✅ Activé' : '❌ Désactivé'; ?></li>
            <li>Support PDO: <?php echo $pdo_enabled ? '✅ Activé' : '❌ Désactivé'; ?></li>
            <li>Support MySQL: <?php echo $mysql_enabled ? '✅ Activé' : '❌ Désactivé'; ?></li>
        </ul>
    </div>
    
    <hr>
    
    <p>Pour plus d'informations, consultez la page de <a href="diagnose-connection.php">diagnostic complet</a>.</p>
    
    <footer style="margin-top: 50px; text-align: center; color: #777;">
        <p>API Index généré le <?php echo date('Y-m-d H:i:s'); ?></p>
    </footer>
</body>
</html>
