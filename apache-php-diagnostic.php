<?php
// Script de diagnostic complet pour la configuration Apache et l'exécution PHP
// Exécuter uniquement via SSH avec: php apache-php-diagnostic.php

if (php_sapi_name() !== 'cli') {
    die("Ce script doit être exécuté uniquement en mode CLI (SSH).\n");
}

echo "=== DIAGNOSTIC APACHE ET PHP VIA SSH ===\n";
echo "Date et heure: " . date('Y-m-d H:i:s') . "\n";
echo "Version PHP: " . phpversion() . "\n\n";

// Définir les chemins importants
$document_root = getcwd();
echo "Répertoire courant (Document Root): $document_root\n";

// 1. Vérification des fichiers de configuration
echo "\n=== VÉRIFICATION DES FICHIERS DE CONFIGURATION ===\n";

$config_files = [
    '.htaccess' => 'Configuration Apache principale',
    '.user.ini' => 'Configuration PHP utilisateur',
    'api/.htaccess' => 'Configuration API',
    'php.ini' => 'Configuration PHP globale (si présente)'
];

foreach ($config_files as $file => $description) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $size = filesize($file);
        $perms = substr(sprintf('%o', fileperms($file)), -4);
        
        echo "✓ $file ($description):\n";
        echo "  - Taille: $size octets\n";
        echo "  - Permissions: $perms\n";
        
        // Analyse du contenu
        if ($file == '.htaccess') {
            // Vérifier les directives importantes dans .htaccess
            $php_handler = preg_match('/SetHandler\s+application\/x-httpd-php/', $content);
            $php_type = preg_match('/AddType\s+application\/x-httpd-php/', $content);
            $rewrite_engine = preg_match('/RewriteEngine\s+On/', $content);
            
            echo "  - Directive SetHandler pour PHP: " . ($php_handler ? "Présente ✓" : "Manquante ✗") . "\n";
            echo "  - Directive AddType pour PHP: " . ($php_type ? "Présente ✓" : "Manquante ✗") . "\n";
            echo "  - RewriteEngine activé: " . ($rewrite_engine ? "Oui ✓" : "Non ✗") . "\n";
        }
        elseif ($file == '.user.ini') {
            // Vérifier les directives importantes dans .user.ini
            $display_errors = preg_match('/display_errors\s*=\s*On/', $content);
            echo "  - Affichage des erreurs: " . ($display_errors ? "Activé" : "Désactivé") . "\n";
        }
    } else {
        echo "✗ $file non trouvé\n";
    }
}

// 2. Test d'une requête HTTP simulée
echo "\n=== SIMULATION D'UNE REQUÊTE HTTP POUR TESTER PHP ===\n";

// Créer un fichier de test temporaire
$test_file = 'ssh-php-web-test-' . time() . '.php';
$test_content = "<?php\necho 'PHP_TEST_SUCCESS';\n?>";
file_put_contents($test_file, $test_content);
echo "Fichier de test créé: $test_file\n";

// Tenter d'effectuer une requête curl vers localhost ou le domaine
$domain = "qualiopi.ch";
$url = "https://$domain/$test_file";
echo "Tentative d'accès à: $url\n";

if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo "Résultat de la requête:\n";
    echo "  - Code HTTP: $http_code\n";
    echo "  - Type de contenu: " . ($content_type ?? "Non spécifié") . "\n";
    
    if ($error) {
        echo "  - Erreur cURL: $error\n";
    }
    
    if ($response) {
        echo "  - Réponse reçue (" . strlen($response) . " octets)\n";
        echo "  - Contenu: " . substr($response, 0, 100) . (strlen($response) > 100 ? "..." : "") . "\n";
        
        // Vérifier si PHP s'exécute correctement
        if (strpos($response, 'PHP_TEST_SUCCESS') !== false) {
            echo "  ✓ PHP s'exécute correctement via le web!\n";
        } else {
            echo "  ✗ PHP ne semble pas s'exécuter correctement via le web\n";
            echo "    Le fichier PHP est probablement téléchargé ou affiché comme texte brut\n";
        }
    } else {
        echo "  ✗ Aucune réponse reçue\n";
    }
} else {
    echo "✗ La fonction curl_init() n'est pas disponible sur ce serveur\n";
}

// 3. Analyse du serveur Apache
echo "\n=== ANALYSE DE LA CONFIGURATION APACHE ===\n";

// Vérifier si le mod_php est activé via phpinfo
ob_start();
phpinfo(INFO_MODULES);
$phpinfo = ob_get_clean();

if (strpos($phpinfo, 'mod_php') !== false || strpos($phpinfo, 'php_module') !== false) {
    echo "✓ Module PHP Apache (mod_php) détecté\n";
} else {
    echo "✗ Module PHP Apache (mod_php) non détecté - PHP pourrait être exécuté en mode CGI/FastCGI\n";
    
    // Vérifier le mode d'exécution PHP
    echo "Mode d'exécution PHP: " . php_sapi_name() . "\n";
    
    if (php_sapi_name() == 'cgi-fcgi' || php_sapi_name() == 'fpm-fcgi') {
        echo "✓ PHP s'exécute en mode FastCGI\n";
    }
}

// 4. Test des permissions et exécution des scripts
echo "\n=== TEST DES PERMISSIONS ET EXÉCUTION DES SCRIPTS ===\n";

// Vérifier les permissions du répertoire
$perms_dir = substr(sprintf('%o', fileperms($document_root)), -4);
echo "Permissions du répertoire racine: $perms_dir\n";

// Tester l'exécution directe d'un script PHP
$test_script = <<<'PHP'
<?php
$env = [];
$env['SERVER_SOFTWARE'] = $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible';
$env['DOCUMENT_ROOT'] = $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible';
$env['SCRIPT_FILENAME'] = $_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible';
$env['PHP_SELF'] = $_SERVER['PHP_SELF'] ?? 'Non disponible';
$env['USER'] = getenv('USER');
$env['HOME'] = getenv('HOME');

echo json_encode($env, JSON_PRETTY_PRINT);
?>
PHP;

$test_file = 'env-test-' . time() . '.php';
file_put_contents($test_file, $test_script);
chmod($test_file, 0755);

echo "Test d'exécution directe du script PHP...\n";
$php_exec = shell_exec("php $test_file");
echo "Résultat:\n";

if ($php_exec) {
    $env_data = json_decode($php_exec, true);
    if ($env_data) {
        foreach ($env_data as $key => $value) {
            echo "  $key: $value\n";
        }
    } else {
        echo $php_exec;
    }
} else {
    echo "  Aucun résultat retourné\n";
}

// 5. Nettoyer les fichiers temporaires
@unlink($test_file);
@unlink('ssh-php-web-test-' . time() . '.php');

echo "\n=== RECOMMANDATIONS ===\n";
echo "1. Si PHP ne s'exécute pas via le web mais fonctionne en SSH:\n";
echo "   - Vérifiez que le handler PHP est correctement configuré dans Apache\n";
echo "   - Assurez-vous que le module PHP est activé sur votre hébergement Infomaniak\n";
echo "   - Contactez le support Infomaniak si nécessaire\n";
echo "\n2. Pour déboguer davantage:\n";
echo "   - Vérifiez les logs d'erreur Apache (si accessibles)\n";
echo "   - Essayez une page PHP minimale sans .htaccess pour isoler le problème\n";
echo "   - Testez avec différentes extensions de fichier (.php5, .php7, etc.)\n";

echo "\n=== DIAGNOSTIC TERMINÉ ===\n";
?>
