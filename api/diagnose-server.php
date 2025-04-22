
<?php
// Script de diagnostic pour identifier pourquoi PHP n'est pas exécuté
header('Content-Type: text/html; charset=utf-8');

// Collecter les informations de configuration du serveur
$server_info = [
    'PHP_VERSION' => PHP_VERSION,
    'SERVER_SOFTWARE' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
    'SCRIPT_FILENAME' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible',
    'PHP_SAPI' => php_sapi_name(),
    'SERVER_PROTOCOL' => $_SERVER['SERVER_PROTOCOL'] ?? 'Non disponible'
];

// Tester les modules PHP chargés
$modules = get_loaded_extensions();
$important_modules = [
    'mysqli' => in_array('mysqli', $modules),
    'pdo_mysql' => in_array('pdo_mysql', $modules),
    'json' => in_array('json', $modules),
    'curl' => in_array('curl', $modules),
    'mbstring' => in_array('mbstring', $modules)
];

// Vérifier l'accès aux fichiers
$files_access = [
    'htaccess_root' => file_exists('../.htaccess') ? 'Oui' : 'Non',
    'htaccess_api' => file_exists('./.htaccess') ? 'Oui' : 'Non',
    'config_dir' => is_dir('./config') ? 'Oui' : 'Non',
    'database_php' => file_exists('./config/database.php') ? 'Oui' : 'Non',
    'db_config_json' => file_exists('./config/db_config.json') ? 'Oui' : 'Non'
];

// Afficher le rapport HTML
echo '<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic du serveur PHP</title>
    <style>
        body {font-family: Arial, sans-serif; margin: 20px; line-height: 1.6;}
        h1, h2 {color: #333;}
        .section {margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px;}
        .success {color: green; font-weight: bold;}
        .error {color: red; font-weight: bold;}
        .warning {color: orange; font-weight: bold;}
        pre {background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;}
    </style>
</head>
<body>
    <h1>Diagnostic du serveur PHP</h1>
    
    <div class="section">
        <h2>Informations sur le serveur</h2>
        <ul>';
foreach($server_info as $key => $value) {
    echo "<li><strong>$key:</strong> $value</li>";
}
echo '</ul>
    </div>
    
    <div class="section">
        <h2>Modules PHP importants</h2>
        <ul>';
foreach($important_modules as $module => $loaded) {
    $status_class = $loaded ? 'success' : 'error';
    $status_text = $loaded ? 'Chargé' : 'Non chargé';
    echo "<li><strong>$module:</strong> <span class=\"$status_class\">$status_text</span></li>";
}
echo '</ul>
    </div>
    
    <div class="section">
        <h2>Accès aux fichiers</h2>
        <ul>';
foreach($files_access as $file => $exists) {
    $status_class = $exists == 'Oui' ? 'success' : 'error';
    echo "<li><strong>$file:</strong> <span class=\"$status_class\">$exists</span></li>";
}
echo '</ul>
    </div>
    
    <div class="section">
        <h2>Test de connexion à la base de données</h2>';
        
// Test de connexion à la base de données si config existe
if (file_exists('./config/database.php') && file_exists('./config/db_config.json')) {
    try {
        require_once './config/database.php';
        $database = new Database();
        $conn = $database->getConnection(false);
        
        if ($database->is_connected) {
            echo '<p class="success">Connexion à la base de données réussie</p>';
            echo '<ul>';
            echo '<li><strong>Hôte:</strong> ' . $database->host . '</li>';
            echo '<li><strong>Base de données:</strong> ' . $database->db_name . '</li>';
            echo '<li><strong>Utilisateur:</strong> ' . $database->username . '</li>';
            echo '</ul>';
        } else {
            echo '<p class="error">Échec de la connexion à la base de données</p>';
            echo '<p>Erreur: ' . ($database->connection_error ?? 'Inconnue') . '</p>';
        }
    } catch (Exception $e) {
        echo '<p class="error">Exception lors du test de connexion à la base de données:</p>';
        echo '<pre>' . $e->getMessage() . '</pre>';
    }
} else {
    echo '<p class="warning">Configuration de base de données introuvable</p>';
}
        
echo '</div>
    
    <div class="section">
        <h2>Problèmes courants et solutions</h2>
        <ol>
            <li>Si PHP n\'est pas exécuté, vérifiez que le module PHP est activé sur votre serveur</li>
            <li>Vérifiez que les fichiers .htaccess sont correctement configurés</li>
            <li>Assurez-vous que le serveur est configuré pour exécuter les fichiers .php</li>
            <li>Vérifiez les permissions des fichiers et dossiers</li>
            <li>Contactez votre hébergeur pour vérifier la configuration PHP</li>
        </ol>
    </div>
</body>
</html>';
?>
