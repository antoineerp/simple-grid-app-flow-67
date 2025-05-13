
<?php
// Un test PHP très simple qui affiche du HTML au lieu du JSON
// pour voir si PHP est exécuté correctement

// Forcer l'affichage des erreurs
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Définir le type de contenu en HTML
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test PHP Basique</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .success { color: green; }
        .error { color: red; }
        pre { background: #f5f5f5; padding: 10px; }
    </style>
</head>
<body>
    <h1>Test de base PHP</h1>
    
    <?php if (function_exists('phpversion')): ?>
        <p class="success">PHP fonctionne! Version: <?php echo phpversion(); ?></p>
    <?php else: ?>
        <p class="error">PHP ne semble pas s'exécuter correctement.</p>
    <?php endif; ?>
    
    <h2>Informations sur le serveur</h2>
    <pre>
    <?php 
        if (isset($_SERVER)) {
            echo "SERVER_SOFTWARE: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Non défini') . "\n";
            echo "DOCUMENT_ROOT: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Non défini') . "\n";
            echo "SCRIPT_FILENAME: " . ($_SERVER['SCRIPT_FILENAME'] ?? 'Non défini') . "\n";
            echo "PHP_SELF: " . ($_SERVER['PHP_SELF'] ?? 'Non défini') . "\n";
        } else {
            echo "La variable \$_SERVER n'est pas disponible.";
        }
    ?>
    </pre>
    
    <h2>Extensions PHP</h2>
    <pre>
    <?php
        if (function_exists('get_loaded_extensions')) {
            $extensions = get_loaded_extensions();
            echo implode(", ", $extensions);
        } else {
            echo "Impossible de récupérer les extensions PHP.";
        }
    ?>
    </pre>
    
    <h2>Test .htaccess</h2>
    <p>
        Si vous voyez ce message, le fichier .htaccess ne bloque pas l'accès à ce fichier PHP.
        Si PHP est installé correctement mais ne s'exécute pas, vérifiez la configuration du serveur.
    </p>
</body>
</html>
