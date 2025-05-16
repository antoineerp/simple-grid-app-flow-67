
<?php
header('Content-Type: text/html; charset=utf-8');

// Configuration
$owner = 'antoineerp'; // Propriétaire du dépôt GitHub
$repo = 'qualiopi-ch'; // Nom du dépôt GitHub
$branch = 'main'; // Branche par défaut
$github_token = ''; // Laisser vide ou remplir avec votre token GitHub personnel
$local_files_to_check = [
    'github-sync-status.php',
    'github-webhook.php',
    'test-assets-routes.php',
    'check-assets-deployment.php',
    'check-github-workflow.php',
    'fix-workflow-yaml.php',
    'deploy-on-infomaniak.php',
    'index.html',
    'assets/.htaccess'
];

// Fonction pour récupérer un fichier depuis GitHub
function getFileFromGithub($owner, $repo, $path, $branch = 'main', $token = '') {
    $url = "https://api.github.com/repos/$owner/$repo/contents/$path?ref=$branch";
    $headers = ['Accept: application/vnd.github.v3.raw'];
    
    if (!empty($token)) {
        $headers[] = "Authorization: token $token";
    }
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'PHP GitHub File Viewer v1.0');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $content = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    
    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        return [
            'success' => false,
            'message' => "Erreur cURL: $error",
            'content' => null
        ];
    }
    
    curl_close($ch);
    
    if ($http_code !== 200) {
        return [
            'success' => false,
            'message' => "Erreur HTTP $http_code lors de l'accès au fichier",
            'content' => null
        ];
    }
    
    return [
        'success' => true,
        'message' => 'Fichier récupéré avec succès',
        'content' => $content,
        'type' => $content_type
    ];
}

// Fonction pour récupérer un fichier local
function getLocalFile($path) {
    if (!file_exists($path)) {
        return [
            'success' => false,
            'message' => "Le fichier local n'existe pas",
            'content' => null
        ];
    }
    
    $content = file_get_contents($path);
    
    if ($content === false) {
        return [
            'success' => false,
            'message' => "Impossible de lire le fichier local",
            'content' => null
        ];
    }
    
    return [
        'success' => true,
        'message' => 'Fichier local récupéré avec succès',
        'content' => $content
    ];
}

// Fonction pour créer un fichier local à partir du contenu GitHub
function createOrUpdateLocalFile($path, $content) {
    $directory = dirname($path);
    
    // Créer le répertoire s'il n'existe pas
    if (!is_dir($directory)) {
        if (!mkdir($directory, 0755, true)) {
            return [
                'success' => false,
                'message' => "Impossible de créer le répertoire $directory"
            ];
        }
    }
    
    if (file_put_contents($path, $content) === false) {
        return [
            'success' => false,
            'message' => "Impossible d'écrire dans le fichier $path"
        ];
    }
    
    return [
        'success' => true,
        'message' => "Fichier $path créé ou mis à jour avec succès"
    ];
}

// Configuration du token GitHub depuis un formulaire
if (isset($_POST['set_token']) && !empty($_POST['github_token'])) {
    $github_token = trim($_POST['github_token']);
    // Stocker temporairement le token dans la session
    session_start();
    $_SESSION['github_token'] = $github_token;
    
    // Rediriger pour éviter la resoumission du formulaire
    header('Location: ' . $_SERVER['PHP_SELF'] . (isset($_GET['file']) ? '?file=' . urlencode($_GET['file']) : ''));
    exit;
}

// Récupérer le token depuis la session si disponible
session_start();
if (empty($github_token) && isset($_SESSION['github_token'])) {
    $github_token = $_SESSION['github_token'];
}

// Récupère un fichier spécifique si demandé via GET
$selected_file = isset($_GET['file']) ? $_GET['file'] : null;
$github_result = null;
$local_result = null;
$sync_result = null;

// Action de synchronisation
if (isset($_POST['sync_file']) && !empty($_POST['file_path'])) {
    $file_to_sync = $_POST['file_path'];
    $github_file = getFileFromGithub($owner, $repo, $file_to_sync, $branch, $github_token);
    
    if ($github_file['success']) {
        $sync_result = createOrUpdateLocalFile($file_to_sync, $github_file['content']);
        $selected_file = $file_to_sync;
    } else {
        $sync_result = [
            'success' => false,
            'message' => "Impossible de récupérer le fichier GitHub: " . $github_file['message']
        ];
    }
}

// Si un fichier est sélectionné, récupérer son contenu
if ($selected_file) {
    $github_result = getFileFromGithub($owner, $repo, $selected_file, $branch, $github_token);
    $local_result = getLocalFile($selected_file);
}

// Récupérer la liste des fichiers disponibles sur GitHub
function listFilesFromGithub($owner, $repo, $path = '', $branch = 'main', $token = '') {
    $url = "https://api.github.com/repos/$owner/$repo/contents/$path?ref=$branch";
    $headers = ['Accept: application/vnd.github.v3+json'];
    
    if (!empty($token)) {
        $headers[] = "Authorization: token $token";
    }
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_USERAGENT, 'PHP GitHub File Lister v1.0');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $content = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        return [
            'success' => false,
            'message' => "Erreur cURL: $error",
            'files' => []
        ];
    }
    
    curl_close($ch);
    
    if ($http_code !== 200) {
        return [
            'success' => false,
            'message' => "Erreur HTTP $http_code lors de la liste des fichiers",
            'files' => []
        ];
    }
    
    $files_data = json_decode($content, true);
    
    if (!is_array($files_data)) {
        return [
            'success' => false,
            'message' => "Réponse invalide de l'API GitHub",
            'files' => []
        ];
    }
    
    $files = [];
    foreach ($files_data as $file) {
        if ($file['type'] === 'file') {
            $files[] = [
                'name' => $file['name'],
                'path' => $file['path'],
                'size' => $file['size'],
                'type' => $file['type']
            ];
        }
    }
    
    return [
        'success' => true,
        'message' => 'Liste de fichiers récupérée avec succès',
        'files' => $files
    ];
}

// Récupérer des fichiers spécifiques ou explorer le dépôt
$github_files = [];
$search_path = '';

if (isset($_GET['path'])) {
    $search_path = $_GET['path'];
    $github_files_result = listFilesFromGithub($owner, $repo, $search_path, $branch, $github_token);
    if ($github_files_result['success']) {
        $github_files = $github_files_result['files'];
    }
} else {
    // Par défaut, vérifier les fichiers spécifiés dans $local_files_to_check
    foreach ($local_files_to_check as $file_path) {
        $exists_locally = file_exists($file_path);
        $github_file_result = getFileFromGithub($owner, $repo, $file_path, $branch, $github_token);
        
        $github_files[] = [
            'path' => $file_path,
            'exists_locally' => $exists_locally,
            'exists_on_github' => $github_file_result['success']
        ];
    }
}

// Recherche de fichiers
$search_results = [];
if (isset($_GET['search']) && !empty($_GET['search'])) {
    $search_term = $_GET['search'];
    // Cette fonction est simplifiée - une recherche complète nécessiterait plus de travail avec l'API GitHub
    $search_url = "https://api.github.com/search/code?q=$search_term+in:file+repo:$owner/$repo";
    
    $headers = ['Accept: application/vnd.github.v3+json'];
    if (!empty($github_token)) {
        $headers[] = "Authorization: token $token";
    }
    
    $ch = curl_init($search_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_USERAGENT, 'PHP GitHub File Search v1.0');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $content = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        curl_close($ch);
        $search_results = [];
    } else {
        curl_close($ch);
        
        if ($http_code === 200) {
            $search_data = json_decode($content, true);
            if (isset($search_data['items']) && is_array($search_data['items'])) {
                foreach ($search_data['items'] as $item) {
                    $search_results[] = [
                        'path' => $item['path'],
                        'name' => basename($item['path']),
                        'url' => $item['html_url']
                    ];
                }
            }
        }
    }
}

// Test de connectivité GitHub
$connectivity_test = [
    'success' => false,
    'message' => 'Test de connectivité non effectué'
];

if (isset($_POST['test_connection']) || empty($github_files)) {
    $test_url = "https://api.github.com/repos/$owner/$repo";
    $headers = ['Accept: application/vnd.github.v3+json'];
    
    if (!empty($github_token)) {
        $headers[] = "Authorization: token $github_token";
    }
    
    $ch = curl_init($test_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_USERAGENT, 'PHP GitHub Connectivity Test v1.0');
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        $connectivity_test = [
            'success' => false,
            'message' => "Erreur de connexion: $error"
        ];
    } else {
        curl_close($ch);
        
        if ($http_code >= 200 && $http_code < 300) {
            $connectivity_test = [
                'success' => true,
                'message' => "Connexion à GitHub établie avec succès (HTTP $http_code)"
            ];
        } else if ($http_code == 401) {
            $connectivity_test = [
                'success' => false,
                'message' => "Erreur d'authentification (HTTP 401). Veuillez vérifier votre token GitHub."
            ];
        } else if ($http_code == 404) {
            $connectivity_test = [
                'success' => false,
                'message' => "Dépôt non trouvé (HTTP 404). Veuillez vérifier le propriétaire et le nom du dépôt."
            ];
        } else {
            $connectivity_test = [
                'success' => false,
                'message' => "Erreur de connexion à GitHub (HTTP $http_code)"
            ];
        }
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Visualiseur de Fichiers GitHub</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .file-list { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
        .file-card { 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            padding: 10px; 
            width: calc(33.333% - 10px);
            box-sizing: border-box;
            background: #f9f9f9;
        }
        .file-card.exists-both { background-color: #e8f5e9; }
        .file-card.exists-github-only { background-color: #fff3e0; }
        .file-card.exists-local-only { background-color: #e3f2fd; }
        .search-form { margin-bottom: 20px; display: flex; gap: 10px; }
        .search-input { padding: 8px; flex: 1; border: 1px solid #ddd; border-radius: 4px; }
        .button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
            border-radius: 4px;
            cursor: pointer;
        }
        .button-secondary { background-color: #2196F3; }
        .button-warning { background-color: #FF9800; }
        .button-danger { background-color: #F44336; }
        .file-view { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .file-content { 
            border: 1px solid #ddd; 
            border-radius: 4px;
            padding: 15px;
            white-space: pre-wrap;
            overflow-x: auto;
            font-family: monospace;
            font-size: 14px;
            line-height: 1.5;
            height: 500px;
            overflow-y: auto;
            background-color: #f5f5f5;
        }
        .file-info { margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .navigation { margin-bottom: 20px; }
        .breadcrumbs { margin-bottom: 10px; }
        .breadcrumbs a { text-decoration: none; color: #2196F3; }
        .notification {
            padding: 10px 15px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .notification-success { background-color: #e8f5e9; border-left: 4px solid #4CAF50; }
        .notification-error { background-color: #ffebee; border-left: 4px solid #f44336; }
        .config-form {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
        }
        .form-group {
            margin-bottom: 10px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-group input {
            padding: 8px;
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        @media (max-width: 768px) {
            .file-card { width: 100%; }
            .file-view { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Visualiseur de Fichiers GitHub</h1>
            <p>Comparez les fichiers entre votre dépôt GitHub et votre environnement local</p>
        </div>
        
        <!-- Notification de connectivité -->
        <?php if (isset($connectivity_test)): ?>
            <div class="notification <?php echo $connectivity_test['success'] ? 'notification-success' : 'notification-error'; ?>">
                <strong>Test de connectivité GitHub:</strong> <?php echo $connectivity_test['message']; ?>
            </div>
        <?php endif; ?>
        
        <!-- Notification de synchronisation -->
        <?php if ($sync_result): ?>
            <div class="notification <?php echo $sync_result['success'] ? 'notification-success' : 'notification-error'; ?>">
                <?php echo $sync_result['message']; ?>
            </div>
        <?php endif; ?>
        
        <!-- Configuration GitHub -->
        <div class="config-form">
            <h2>Configuration GitHub</h2>
            <form method="post" action="<?php echo $_SERVER['PHP_SELF']; ?>">
                <div class="form-group">
                    <label for="owner">Propriétaire du dépôt:</label>
                    <input type="text" id="owner" name="owner" value="<?php echo htmlspecialchars($owner); ?>" required>
                </div>
                <div class="form-group">
                    <label for="repo">Nom du dépôt:</label>
                    <input type="text" id="repo" name="repo" value="<?php echo htmlspecialchars($repo); ?>" required>
                </div>
                <div class="form-group">
                    <label for="branch">Branche:</label>
                    <input type="text" id="branch" name="branch" value="<?php echo htmlspecialchars($branch); ?>" required>
                </div>
                <div class="form-group">
                    <label for="github_token">Token GitHub (facultatif mais recommandé):</label>
                    <input type="password" id="github_token" name="github_token" value="<?php echo !empty($github_token) ? '••••••••••••••••' : ''; ?>" placeholder="Entrez votre token GitHub personnel">
                    <p><small>Un token personnel GitHub augmente les limites de taux d'API et permet d'accéder aux dépôts privés.</small></p>
                </div>
                <button type="submit" name="set_token" class="button">Appliquer la configuration</button>
                <button type="submit" name="test_connection" class="button button-secondary">Tester la connexion</button>
            </form>
        </div>
        
        <!-- Formulaire de recherche -->
        <form method="GET" class="search-form">
            <input type="text" name="search" placeholder="Rechercher des fichiers..." class="search-input" value="<?php echo isset($_GET['search']) ? htmlspecialchars($_GET['search']) : ''; ?>">
            <button type="submit" class="button">Rechercher</button>
            <a href="<?php echo $_SERVER['PHP_SELF']; ?>" class="button button-secondary">Réinitialiser</a>
        </form>
        
        <!-- Navigation / Fil d'Ariane -->
        <div class="navigation">
            <div class="breadcrumbs">
                <a href="<?php echo $_SERVER['PHP_SELF']; ?>">Accueil</a>
                <?php
                if (!empty($search_path)) {
                    $path_parts = explode('/', $search_path);
                    $current_path = '';
                    foreach ($path_parts as $part) {
                        $current_path .= ($current_path ? '/' : '') . $part;
                        echo ' / <a href="?path=' . urlencode($current_path) . '">' . htmlspecialchars($part) . '</a>';
                    }
                }
                ?>
            </div>
        </div>

        <?php if (isset($_GET['search'])): ?>
            <h2>Résultats de recherche pour "<?php echo htmlspecialchars($_GET['search']); ?>"</h2>
            <?php if (empty($search_results)): ?>
                <p>Aucun résultat trouvé.</p>
            <?php else: ?>
                <div class="file-list">
                    <?php foreach ($search_results as $result): ?>
                        <div class="file-card">
                            <h3><?php echo htmlspecialchars($result['name']); ?></h3>
                            <p><?php echo htmlspecialchars($result['path']); ?></p>
                            <a href="?file=<?php echo urlencode($result['path']); ?>" class="button">Voir le fichier</a>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        <?php elseif (isset($_GET['path'])): ?>
            <h2>Exploration du dossier: <?php echo htmlspecialchars($search_path ? $search_path : '/'); ?></h2>
            <?php if (empty($github_files)): ?>
                <p>Aucun fichier trouvé dans ce dossier.</p>
            <?php else: ?>
                <div class="file-list">
                    <?php foreach ($github_files as $file): ?>
                        <div class="file-card">
                            <h3><?php echo htmlspecialchars($file['name']); ?></h3>
                            <p><?php echo htmlspecialchars($file['path']); ?></p>
                            <a href="?file=<?php echo urlencode($file['path']); ?>" class="button">Voir le fichier</a>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        <?php else: ?>
            <h2>Fichiers à comparer</h2>
            <div class="file-list">
                <?php foreach ($github_files as $file): ?>
                    <?php
                    $class = '';
                    if (isset($file['exists_locally']) && isset($file['exists_on_github'])) {
                        if ($file['exists_locally'] && $file['exists_on_github']) {
                            $class = 'exists-both';
                            $status = 'Présent dans les deux';
                        } elseif ($file['exists_on_github']) {
                            $class = 'exists-github-only';
                            $status = 'Présent uniquement sur GitHub';
                        } elseif ($file['exists_locally']) {
                            $class = 'exists-local-only';
                            $status = 'Présent uniquement en local';
                        }
                    }
                    ?>
                    <div class="file-card <?php echo $class; ?>">
                        <h3><?php echo htmlspecialchars(basename($file['path'])); ?></h3>
                        <p><?php echo htmlspecialchars($file['path']); ?></p>
                        <p><strong>Statut:</strong> <?php echo isset($status) ? $status : 'Inconnu'; ?></p>
                        <a href="?file=<?php echo urlencode($file['path']); ?>" class="button">Comparer</a>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        
        <?php if ($selected_file): ?>
            <h2>Comparaison du fichier: <?php echo htmlspecialchars($selected_file); ?></h2>
            <div class="file-view">
                <div>
                    <h3>Version GitHub</h3>
                    <div class="file-content">
                        <?php if ($github_result && $github_result['success']): ?>
                            <?php echo htmlspecialchars($github_result['content']); ?>
                        <?php else: ?>
                            <p class="error">Impossible de récupérer le fichier depuis GitHub.</p>
                            <?php if (isset($github_result['message'])): ?>
                                <p><?php echo htmlspecialchars($github_result['message']); ?></p>
                            <?php endif; ?>
                        <?php endif; ?>
                    </div>
                </div>
                <div>
                    <h3>Version Locale</h3>
                    <div class="file-content">
                        <?php if ($local_result && $local_result['success']): ?>
                            <?php echo htmlspecialchars($local_result['content']); ?>
                        <?php else: ?>
                            <p class="error">Impossible de récupérer le fichier local.</p>
                            <?php if (isset($local_result['message'])): ?>
                                <p><?php echo htmlspecialchars($local_result['message']); ?></p>
                            <?php endif; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
            <div class="file-info">
                <?php if ($github_result && $github_result['success']): ?>
                    <form method="post" action="<?php echo $_SERVER['PHP_SELF']; ?>">
                        <input type="hidden" name="file_path" value="<?php echo htmlspecialchars($selected_file); ?>">
                        <p>Synchroniser ce fichier depuis GitHub vers local ?</p>
                        <button type="submit" name="sync_file" class="button button-warning">
                            Synchroniser de GitHub vers Local
                        </button>
                    </form>
                <?php endif; ?>
            </div>
        <?php endif; ?>
        
        <div class="file-info">
            <h3>Actions</h3>
            <p>
                <a href="fix-index-html.php" class="button button-secondary">Corriger les références index.html</a>
                <a href="test-assets-routes.php" class="button button-secondary">Vérifier routes CSS/JS</a>
                <a href="fix-htaccess.php" class="button button-secondary">Corriger .htaccess</a>
            </p>
        </div>
    </div>
</body>
</html>
