<?php
header('Content-Type: text/html; charset=utf-8');

// Définir une fonction pour échapper les sorties HTML
function h($text) {
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}

// Fonction pour tester si un fichier existe
function checkFileExists($path) {
    $fullPath = $_SERVER['DOCUMENT_ROOT'] . $path;
    $exists = file_exists($fullPath);
    return [
        'path' => $path,
        'full_path' => $fullPath,
        'exists' => $exists,
        'size' => $exists ? filesize($fullPath) . ' bytes' : 'N/A',
        'modified' => $exists ? date("Y-m-d H:i:s", filemtime($fullPath)) : 'N/A'
    ];
}

// Récupérer les détails du serveur
$server_info = [
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'Non disponible',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Non disponible',
    'php_version' => PHP_VERSION,
    'php_sapi' => php_sapi_name(),
    'current_dir' => getcwd(),
    'disk_free_space' => function_exists('disk_free_space') ? round(disk_free_space('.') / (1024 * 1024 * 1024), 2) . ' GB' : 'Non disponible'
];

// Récupérer les valeurs depuis les fichiers de configuration
$config_values = [];

// Fichier env.php
if (file_exists(__DIR__ . '/config/env.php')) {
    include_once __DIR__ . '/config/env.php';
    $config_values['env'] = [
        'DB_HOST' => defined('DB_HOST') ? DB_HOST : 'Non défini',
        'DB_NAME' => defined('DB_NAME') ? DB_NAME : 'Non défini',
        'DB_USER' => defined('DB_USER') ? DB_USER : 'Non défini',
        'DB_PASS' => defined('DB_PASS') ? 'Défini (masqué)' : 'Non défini',
        'API_BASE_URL' => defined('API_BASE_URL') ? API_BASE_URL : 'Non défini',
        'APP_ENV' => defined('APP_ENV') ? APP_ENV : 'Non défini'
    ];
}

// Fichier db_config.json
$json_config = __DIR__ . '/config/db_config.json';
if (file_exists($json_config)) {
    $json_content = file_get_contents($json_config);
    $config_values['json'] = json_decode($json_content, true);
    // Masquer le mot de passe dans la sortie
    if (isset($config_values['json']['password'])) {
        $config_values['json']['password'] = 'Défini (masqué)';
    }
}

// Tester les connexions à la base de données
$db_tests = [];

// Test avec les valeurs de env.php
if (isset($config_values['env'])) {
    $db_tests['env'] = testDatabaseConnection(
        $config_values['env']['DB_HOST'],
        $config_values['env']['DB_NAME'],
        $config_values['env']['DB_USER'],
        defined('DB_PASS') ? DB_PASS : ''
    );
}

// Test avec les valeurs de db_config.json
if (isset($config_values['json'])) {
    $original_json = json_decode(file_get_contents($json_config), true);
    $db_tests['json'] = testDatabaseConnection(
        $config_values['json']['host'],
        $config_values['json']['db_name'],
        $config_values['json']['username'],
        $original_json['password'] ?? ''
    );
}

// Vérifier les fichiers importants
$important_files = [
    '/api/config/env.php',
    '/api/config/db_config.json',
    '/api/config/database.php',
    '/api/config/DatabaseConfig.php',
    '/api/config/DatabaseConnection.php',
    '/api/auth.php',
    '/api/check-users.php',
    '/index.html'
];

$file_checks = [];
foreach ($important_files as $file) {
    $file_checks[$file] = checkFileExists($file);
}

// Fonction pour tester la connexion à la base de données
function testDatabaseConnection($host, $dbname, $username, $password) {
    try {
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        // Tentative de connexion
        $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
        $pdo = new PDO($dsn, $username, $password, $options);
        
        // Récupérer la version MySQL
        $stmt = $pdo->query('SELECT VERSION() as version');
        $version = $stmt->fetch()['version'];
        
        // Compter les tables dans la base de données
        $stmt = $pdo->query('SHOW TABLES');
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        return [
            'success' => true,
            'version' => $version,
            'tables_count' => count($tables),
            'tables' => $tables,
            'connection_string' => "mysql:host={$host};dbname={$dbname}"
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'connection_string' => "mysql:host={$host};dbname={$dbname}"
        ];
    }
}

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnostic de Connexion à la Base de Données Infomaniak</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        header {
            background-color: #4a6da7;
            color: white;
            padding: 1rem;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        h1, h2, h3 {
            color: #2c3e50;
        }
        .section {
            background: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        th, td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .success {
            color: #2ecc71;
            font-weight: bold;
        }
        .error {
            color: #e74c3c;
            font-weight: bold;
        }
        .warning {
            color: #f39c12;
            font-weight: bold;
        }
        pre {
            background-color: #f8f8f8;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .monospace {
            font-family: monospace;
            background-color: #f8f8f8;
            padding: 2px 4px;
            border-radius: 3px;
        }
        .infomaniak-info {
            border-left: 4px solid #4a6da7;
            padding-left: 15px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <header>
        <h1>Diagnostic de Connexion à la Base de Données Infomaniak</h1>
        <p>
            Cet outil analyse votre configuration et teste la connexion à la base de données Infomaniak.
            Date du diagnostic: <?php echo date('Y-m-d H:i:s'); ?>
        </p>
    </header>

    <div class="section">
        <h2>Informations sur le Serveur</h2>
        <table>
            <tr>
                <th>Paramètre</th>
                <th>Valeur</th>
            </tr>
            <?php foreach ($server_info as $key => $value): ?>
            <tr>
                <td><?php echo h($key); ?></td>
                <td><?php echo h($value); ?></td>
            </tr>
            <?php endforeach; ?>
        </table>
    </div>

    <div class="grid">
        <?php if (!empty($config_values)): ?>
        <div class="section">
            <h2>Valeurs de Configuration</h2>
            
            <?php if (isset($config_values['env'])): ?>
            <h3>Depuis env.php</h3>
            <table>
                <tr>
                    <th>Paramètre</th>
                    <th>Valeur</th>
                </tr>
                <?php foreach ($config_values['env'] as $key => $value): ?>
                <tr>
                    <td><?php echo h($key); ?></td>
                    <td><?php echo h($value); ?></td>
                </tr>
                <?php endforeach; ?>
            </table>
            <?php endif; ?>
            
            <?php if (isset($config_values['json'])): ?>
            <h3>Depuis db_config.json</h3>
            <table>
                <tr>
                    <th>Paramètre</th>
                    <th>Valeur</th>
                </tr>
                <?php foreach ($config_values['json'] as $key => $value): ?>
                <tr>
                    <td><?php echo h($key); ?></td>
                    <td><?php echo h($value); ?></td>
                </tr>
                <?php endforeach; ?>
            </table>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <div class="section">
            <h2>Tests de Connexion à la Base de Données</h2>
            
            <?php if (isset($db_tests['env'])): ?>
            <h3>Test avec env.php</h3>
            <?php if ($db_tests['env']['success']): ?>
            <p class="success">✅ Connexion réussie</p>
            <p>Version MySQL: <?php echo h($db_tests['env']['version']); ?></p>
            <p>Nombre de tables: <?php echo h($db_tests['env']['tables_count']); ?></p>
            <?php if (!empty($db_tests['env']['tables'])): ?>
            <details>
                <summary>Liste des tables (<?php echo count($db_tests['env']['tables']); ?>)</summary>
                <ul>
                    <?php foreach ($db_tests['env']['tables'] as $table): ?>
                    <li><?php echo h($table); ?></li>
                    <?php endforeach; ?>
                </ul>
            </details>
            <?php endif; ?>
            <?php else: ?>
            <p class="error">❌ Échec de la connexion</p>
            <p>Erreur: <?php echo h($db_tests['env']['error']); ?></p>
            <p>Chaîne de connexion: <span class="monospace"><?php echo h($db_tests['env']['connection_string']); ?></span></p>
            <?php endif; ?>
            <?php endif; ?>
            
            <?php if (isset($db_tests['json'])): ?>
            <h3>Test avec db_config.json</h3>
            <?php if ($db_tests['json']['success']): ?>
            <p class="success">✅ Connexion réussie</p>
            <p>Version MySQL: <?php echo h($db_tests['json']['version']); ?></p>
            <p>Nombre de tables: <?php echo h($db_tests['json']['tables_count']); ?></p>
            <?php if (!empty($db_tests['json']['tables'])): ?>
            <details>
                <summary>Liste des tables (<?php echo count($db_tests['json']['tables']); ?>)</summary>
                <ul>
                    <?php foreach ($db_tests['json']['tables'] as $table): ?>
                    <li><?php echo h($table); ?></li>
                    <?php endforeach; ?>
                </ul>
            </details>
            <?php endif; ?>
            <?php else: ?>
            <p class="error">❌ Échec de la connexion</p>
            <p>Erreur: <?php echo h($db_tests['json']['error']); ?></p>
            <p>Chaîne de connexion: <span class="monospace"><?php echo h($db_tests['json']['connection_string']); ?></span></p>
            <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>

    <div class="section">
        <h2>Vérification des Fichiers Importants</h2>
        <table>
            <tr>
                <th>Fichier</th>
                <th>Chemin complet</th>
                <th>Existe</th>
                <th>Taille</th>
                <th>Dernière modification</th>
            </tr>
            <?php foreach ($file_checks as $file => $check): ?>
            <tr>
                <td><?php echo h($file); ?></td>
                <td><?php echo h($check['full_path']); ?></td>
                <td class="<?php echo $check['exists'] ? 'success' : 'error'; ?>">
                    <?php echo $check['exists'] ? '✅ Oui' : '❌ Non'; ?>
                </td>
                <td><?php echo h($check['size']); ?></td>
                <td><?php echo h($check['modified']); ?></td>
            </tr>
            <?php endforeach; ?>
        </table>
    </div>

    <div class="section">
        <h2>Recommandations</h2>
        
        <div class="infomaniak-info">
            <h3>Problèmes de connexion à la base de données</h3>
            <?php if (isset($db_tests['env']) && !$db_tests['env']['success'] || 
                     isset($db_tests['json']) && !$db_tests['json']['success']): ?>
            <p class="warning">⚠️ Des problèmes de connexion à la base de données ont été détectés.</p>
            <ul>
                <?php if (isset($db_tests['env']) && !$db_tests['env']['success']): ?>
                <li>La connexion avec les paramètres de <strong>env.php</strong> a échoué: <?php echo h($db_tests['env']['error']); ?></li>
                <?php endif; ?>
                <?php if (isset($db_tests['json']) && !$db_tests['json']['success']): ?>
                <li>La connexion avec les paramètres de <strong>db_config.json</strong> a échoué: <?php echo h($db_tests['json']['error']); ?></li>
                <?php endif; ?>
            </ul>
            
            <h4>Solutions possibles:</h4>
            <ol>
                <li>Vérifiez que les informations de connexion (hôte, nom d'utilisateur, mot de passe) sont correctes.</li>
                <li>Assurez-vous que l'adresse IP de votre serveur est autorisée à accéder à la base de données MySQL sur Infomaniak.</li>
                <li>Vérifiez que l'utilisateur MySQL a les droits nécessaires pour accéder à la base de données.</li>
                <li>Si vous utilisez un mot de passe avec des caractères spéciaux, assurez-vous qu'il est correctement échappé.</li>
            </ol>
            <?php else: ?>
            <p class="success">✅ Les tests de connexion à la base de données ont réussi!</p>
            <?php endif; ?>
        </div>
        
        <div class="infomaniak-info">
            <h3>Sécurité des informations d'identification</h3>
            <p class="warning">⚠️ Attention aux informations sensibles :</p>
            <ul>
                <li>Les mots de passe de base de données ne doivent pas être stockés en clair dans les fichiers de configuration accessibles publiquement.</li>
                <li>Assurez-vous que les fichiers de configuration comme <code>db_config.json</code> ne sont pas accessibles directement depuis le web.</li>
                <li>Utilisez <code>.htaccess</code> pour protéger le dossier <code>/api/config/</code>.</li>
            </ul>
        </div>
        
        <div class="infomaniak-info">
            <h3>Structure des fichiers</h3>
            <?php
            $missing_files = array_filter($file_checks, function($check) {
                return !$check['exists'];
            });
            if (!empty($missing_files)): 
            ?>
            <p class="warning">⚠️ Certains fichiers importants sont manquants :</p>
            <ul>
                <?php foreach ($missing_files as $file => $check): ?>
                <li><?php echo h($file); ?> est introuvable à l'emplacement <?php echo h($check['full_path']); ?></li>
                <?php endforeach; ?>
            </ul>
            <p>Vérifiez votre déploiement et assurez-vous que tous les fichiers nécessaires ont été correctement transférés sur le serveur.</p>
            <?php else: ?>
            <p class="success">✅ Tous les fichiers essentiels sont présents.</p>
            <?php endif; ?>
        </div>
    </div>

    <div class="section">
        <h2>En cas de problème persistant</h2>
        <p>Si les problèmes de connexion persistent malgré les recommandations ci-dessus, vous pouvez essayer les actions suivantes :</p>
        <ol>
            <li>Contactez le support Infomaniak pour vérifier que votre configuration MySQL est correcte.</li>
            <li>Vérifiez dans le Cockpit Infomaniak que l'utilisateur MySQL a les droits suffisants.</li>
            <li>Assurez-vous que l'accès à distance à MySQL est activé pour votre base de données.</li>
            <li>Essayez de créer un nouvel utilisateur MySQL avec un mot de passe simple (temporairement) pour tester.</li>
        </ol>
    </div>

    <footer class="section">
        <p>Diagnostic généré le <?php echo date('Y-m-d H:i:s'); ?></p>
        <p><a href="<?php echo htmlspecialchars($_SERVER['PHP_SELF']); ?>">Rafraîchir le diagnostic</a> | <a href="/">Retour à l'accueil</a></p>
    </footer>
</body>
</html>
