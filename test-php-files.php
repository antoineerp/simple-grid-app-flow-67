
<?php
// Ce script permet de tester l'intégrité des fichiers PHP déployés
header('Content-Type: text/html; charset=utf-8');

// Fonction pour vérifier le contenu d'un fichier et détecter des erreurs évidentes
function check_file_content($file_path) {
    if (!file_exists($file_path)) {
        return ["status" => "error", "message" => "Fichier non trouvé"];
    }
    
    $content = file_get_contents($file_path);
    
    // Vérification des erreurs communes
    $errors = [];
    
    // Détection de texte "Check failure" ou messages d'erreur
    if (strpos($content, "Check failure") !== false) {
        $errors[] = "Le fichier contient 'Check failure', possible erreur de déploiement";
    }
    
    // Pour les fichiers PHP, vérifier que le code est syntaxiquement correct
    if (pathinfo($file_path, PATHINFO_EXTENSION) == "php") {
        // Vérifier la syntaxe PHP (nécessite l'accès à l'exécution en ligne de commande)
        if (function_exists('exec')) {
            $output = [];
            $return_var = 0;
            exec("php -l " . escapeshellarg($file_path), $output, $return_var);
            if ($return_var !== 0) {
                $errors[] = "Erreur de syntaxe PHP: " . implode("\n", $output);
            }
        } else {
            // Vérifications basiques si exec n'est pas disponible
            $php_tags_count = substr_count($content, "<?php");
            if ($php_tags_count === 0) {
                $errors[] = "Pas de balise <?php trouvée";
            } else if ($php_tags_count > 1) {
                $errors[] = "Plusieurs balises <?php trouvées, cela pourrait être problématique";
            }
        }
    }
    
    // Pour les fichiers JSON, vérifier que le JSON est valide
    if (pathinfo($file_path, PATHINFO_EXTENSION) == "json") {
        json_decode($content);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $errors[] = "Erreur JSON: " . json_last_error_msg();
        }
    }
    
    return [
        "status" => empty($errors) ? "ok" : "warning",
        "errors" => $errors,
        "content" => substr($content, 0, 500) . (strlen($content) > 500 ? "..." : "")  // Aperçu tronqué du contenu
    ];
}

// Tester les fichiers importants
$files_to_test = [
    "api/config/env.php" => "Configuration des variables d'environnement",
    "api/config/db_config.json" => "Configuration de la base de données",
    "users.ini" => "Configuration des utilisateurs",
    "index.php" => "Point d'entrée principal",
    "phpinfo.php" => "Diagnostics PHP"
];

?>
<!DOCTYPE html>
<html>
<head>
    <title>Test des fichiers PHP déployés</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        h1 { color: #333; }
        .file-info { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .file-title { margin-top: 0; color: #444; }
        .status-ok { color: green; }
        .status-warning { color: orange; }
        .status-error { color: red; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
        .button { 
            background-color: #4CAF50; 
            color: white; 
            padding: 8px 15px; 
            text-decoration: none; 
            border-radius: 4px; 
            display: inline-block; 
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>Vérification des fichiers déployés</h1>
    
    <?php foreach ($files_to_test as $file_path => $description): ?>
    <div class="file-info">
        <h2 class="file-title"><?php echo htmlspecialchars($description); ?> (<?php echo htmlspecialchars($file_path); ?>)</h2>
        <?php $check_result = check_file_content($file_path); ?>
        
        <p>Statut : 
            <span class="status-<?php echo $check_result['status']; ?>">
                <?php 
                    if ($check_result['status'] === 'ok') echo "OK";
                    else if ($check_result['status'] === 'warning') echo "ATTENTION";
                    else echo "ERREUR";
                ?>
            </span>
        </p>
        
        <?php if ($check_result['status'] !== 'ok' && isset($check_result['errors'])): ?>
            <p>Problèmes détectés :</p>
            <ul>
                <?php foreach ($check_result['errors'] as $error): ?>
                    <li class="status-<?php echo $check_result['status']; ?>"><?php echo htmlspecialchars($error); ?></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
        
        <p>Aperçu du contenu :</p>
        <pre><?php echo htmlspecialchars($check_result['content'] ?? "Contenu non disponible"); ?></pre>
    </div>
    <?php endforeach; ?>
    
    <p><a href="deploy-check.php" class="button">Diagnostic complet</a></p>
</body>
</html>

