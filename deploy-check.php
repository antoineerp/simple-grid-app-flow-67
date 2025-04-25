
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour vérifier l'existence des répertoires essentiels
function checkDirectories() {
    $requiredDirs = ['api', 'assets', 'dist', 'public/lovable-uploads'];
    $missingDirs = [];

    foreach ($requiredDirs as $dir) {
        if (!is_dir($dir)) {
            $missingDirs[] = $dir;
        }
    }

    return $missingDirs;
}

$missingDirs = checkDirectories();
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic de Déploiement FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; line-height: 1.6; }
        .warning { color: orange; }
        .error { color: red; }
        .success { color: green; }
    </style>
</head>
<body>
    <h1>Diagnostic de Déploiement FormaCert</h1>
    
    <h2>Vérification des Répertoires</h2>
    <?php if (empty($missingDirs)): ?>
        <p class="success">✓ Tous les répertoires essentiels sont présents.</p>
    <?php else: ?>
        <p class="error">⚠️ Répertoires manquants :</p>
        <ul>
            <?php foreach ($missingDirs as $dir): ?>
                <li><?php echo htmlspecialchars($dir); ?></li>
            <?php endforeach; ?>
        </ul>
    <?php endif; ?>

    <h2>Informations Serveur</h2>
    <pre>
    Hostname: <?php echo gethostname(); ?>
    Document Root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?>
    PHP Version: <?php echo phpversion(); ?>
    Server Software: <?php echo $_SERVER['SERVER_SOFTWARE']; ?>
    </pre>
</body>
</html>
