
<?php
// Script de diagnostic pour trouver les chemins corrects sur Infomaniak
header("Content-Type: text/html; charset=UTF-8");

// Activer l'affichage des erreurs pour le diagnostic
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic des Chemins Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Diagnostic des Chemins Infomaniak</h1>";

echo "<h2>Informations PHP de base</h2>";
echo "<p>PHP fonctionne! Version: " . phpversion() . "</p>";
echo "<p>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
echo "<p>Répertoire courant: " . getcwd() . "</p>";
echo "<p>Script: " . $_SERVER['SCRIPT_FILENAME'] . "</p>";

// Tenter de trouver le chemin correct pour les sites
echo "<h2>Recherche des chemins possibles</h2>";
$possible_paths = [
    '/sites/',
    '/www/',
    '/www/sites/',
    '/home/clients/',
    '/home/customers/',
    getcwd(),
    dirname(getcwd()),
    dirname(dirname(getcwd())),
    $_SERVER['DOCUMENT_ROOT'],
    dirname($_SERVER['DOCUMENT_ROOT'])
];

echo "<ul>";
foreach ($possible_paths as $path) {
    if (is_dir($path)) {
        echo "<li class='success'>$path - EXISTE</li>";
        
        // Si c'est un répertoire existant, regardons ce qu'il contient
        $files = scandir($path);
        echo "<ul>";
        foreach ($files as $file) {
            if ($file != '.' && $file != '..' && is_dir($path . $file)) {
                echo "<li>$path$file/ (répertoire)</li>";
            }
        }
        echo "</ul>";
        
        // Tenter de créer un fichier test.php dans ce répertoire
        $test_file = $path . "test-php-" . uniqid() . ".php";
        $test_content = "<?php echo 'PHP fonctionne depuis " . $path . "'; ?>";
        
        if (@file_put_contents($test_file, $test_content) !== false) {
            echo "<p class='success'>Fichier de test créé avec succès: $test_file</p>";
            echo "<p>URL relative: " . str_replace($_SERVER['DOCUMENT_ROOT'], '', $test_file) . "</p>";
        } else {
            echo "<p class='error'>Impossible de créer un fichier dans ce répertoire</p>";
        }
    } else {
        echo "<li class='error'>$path - N'EXISTE PAS</li>";
    }
}
echo "</ul>";

// Chercher spécifiquement le répertoire du domaine qualiopi.ch
echo "<h2>Recherche du répertoire de votre domaine</h2>";

// Chercher dans les répertoires home/clients
if (is_dir('/home/clients/')) {
    $client_dirs = scandir('/home/clients/');
    foreach ($client_dirs as $client) {
        if ($client != '.' && $client != '..' && is_dir('/home/clients/' . $client)) {
            $sites_path = '/home/clients/' . $client . '/sites/';
            if (is_dir($sites_path)) {
                echo "<p class='success'>Répertoire sites trouvé: $sites_path</p>";
                
                $site_dirs = scandir($sites_path);
                echo "<ul>";
                foreach ($site_dirs as $site) {
                    if ($site != '.' && $site != '..' && is_dir($sites_path . $site)) {
                        echo "<li>$sites_path$site/</li>";
                        
                        // Si on trouve qualiopi.ch, c'est probablement le bon
                        if (stripos($site, 'qualiopi') !== false) {
                            echo " <span class='success'>← Probablement votre site!</span>";
                            
                            // Créer un .htaccess dans ce répertoire
                            $htaccess_path = $sites_path . $site . '/.htaccess-new';
                            $htaccess_content = "AddHandler application/x-httpd-php .php\n<FilesMatch \"\\.php$\">\n    SetHandler application/x-httpd-php\n</FilesMatch>\n";
                            
                            if (@file_put_contents($htaccess_path, $htaccess_content) !== false) {
                                echo "<p class='success'>Fichier .htaccess-new créé avec succès à $htaccess_path</p>";
                                echo "<p>Pour l'utiliser, renommez-le en .htaccess</p>";
                            } else {
                                echo "<p class='error'>Impossible de créer le fichier .htaccess dans ce répertoire</p>";
                            }
                        }
                    }
                }
                echo "</ul>";
            }
        }
    }
}

// Tester si le répertoire www existe
if (is_dir($_SERVER['DOCUMENT_ROOT'] . '/www/')) {
    echo "<p class='success'>Le répertoire /www/ existe sous DOCUMENT_ROOT</p>";
} else {
    echo "<p class='error'>Le répertoire /www/ n'existe PAS sous DOCUMENT_ROOT</p>";
}

// Chercher les répertoires où on peut écrire
echo "<h2>Recherche des répertoires accessibles en écriture</h2>";
$writable_paths = [
    $_SERVER['DOCUMENT_ROOT'],
    $_SERVER['DOCUMENT_ROOT'] . '/api/',
    getcwd(),
    dirname(getcwd()),
    '/tmp/'
];

foreach ($writable_paths as $path) {
    if (is_dir($path)) {
        if (is_writable($path)) {
            echo "<p class='success'>$path - ACCESSIBLE EN ÉCRITURE</p>";
            
            // Créer un .htaccess dans ce répertoire si c'est api/
            if (basename($path) == 'api') {
                $htaccess_path = $path . '/.htaccess-new';
                $htaccess_content = "AddHandler application/x-httpd-php .php\n<FilesMatch \"\\.php$\">\n    SetHandler application/x-httpd-php\n</FilesMatch>\n";
                
                if (@file_put_contents($htaccess_path, $htaccess_content) !== false) {
                    echo "<p class='success'>Fichier .htaccess-new créé avec succès à $htaccess_path</p>";
                    echo "<p>Pour l'utiliser, renommez-le en .htaccess</p>";
                } else {
                    echo "<p class='error'>Impossible de créer le fichier .htaccess dans ce répertoire</p>";
                }
            }
        } else {
            echo "<p class='error'>$path - NON ACCESSIBLE EN ÉCRITURE</p>";
        }
    }
}

echo "<h2>Que faire maintenant?</h2>";
echo "<ol>
    <li>Notez le chemin correct de votre site - recherchez 'qualiopi' dans les résultats ci-dessus</li>
    <li>Si un fichier .htaccess-new a été créé, renommez-le en .htaccess</li>
    <li>Contactez le support Infomaniak pour activer l'exécution PHP si ces étapes ne fonctionnent pas</li>
    <li>Vérifiez que PHP est activé dans votre panneau d'administration Infomaniak</li>
</ol>";

echo "</body></html>";
?>
