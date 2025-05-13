
<?php
// Script de diagnostic pour déterminer la structure de répertoires Infomaniak et tester l'exécution PHP
header("Content-Type: text/html; charset=UTF-8");

// Activer l'affichage des erreurs pour le diagnostic
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Tenter de détecter les chemins possibles
function check_directories() {
    $possible_paths = [
        // Chemins standards Infomaniak
        '/home/clients/',
        '/sites/',
        '/www/',
        '/httpdocs/',
        '/htdocs/',
        getcwd(),
        dirname(getcwd()),
        $_SERVER['DOCUMENT_ROOT'],
        dirname($_SERVER['DOCUMENT_ROOT']),
    ];
    
    // Trouver automatiquement l'ID client Infomaniak
    $client_dirs = [];
    if (is_dir('/home/clients/')) {
        $dir_handle = @opendir('/home/clients/');
        if ($dir_handle) {
            while (($file = readdir($dir_handle)) !== false) {
                if ($file != "." && $file != "..") {
                    if (is_dir('/home/clients/' . $file)) {
                        $client_dirs[] = '/home/clients/' . $file . '/';
                    }
                }
            }
            closedir($dir_handle);
        }
    }
    
    // Ajouter les chemins avec ID client détectés
    foreach ($client_dirs as $client_dir) {
        $possible_paths[] = $client_dir;
        $possible_paths[] = $client_dir . 'sites/';
        $possible_paths[] = $client_dir . 'www/';
    }
    
    $results = [];
    foreach ($possible_paths as $path) {
        $exists = is_dir($path);
        $readable = $exists && is_readable($path);
        $writable = $exists && is_writable($path);
        
        $results[$path] = [
            'exists' => $exists,
            'readable' => $readable,
            'writable' => $writable
        ];
        
        // Si c'est un répertoire sites, vérifier les sous-domaines
        if ($exists && (strpos($path, 'sites/') !== false || strpos($path, 'www/') !== false)) {
            $dir_handle = @opendir($path);
            if ($dir_handle) {
                $results[$path]['subdirs'] = [];
                while (($file = readdir($dir_handle)) !== false) {
                    if ($file != "." && $file != "..") {
                        if (is_dir($path . $file)) {
                            $full_path = $path . $file . '/';
                            $results[$path]['subdirs'][$full_path] = [
                                'exists' => true,
                                'readable' => is_readable($full_path),
                                'writable' => is_writable($full_path)
                            ];
                        }
                    }
                }
                closedir($dir_handle);
            }
        }
    }
    
    return $results;
}

// Tenter de créer un fichier PHP de test dans tous les répertoires accessibles
function try_create_test_files($directories) {
    $test_content = '<?php echo "PHP fonctionne correctement ici! Généré à " . date("Y-m-d H:i:s"); ?>';
    $results = [];
    
    foreach ($directories as $path => $info) {
        if ($info['writable']) {
            // Essayer de créer un fichier test.php
            $test_file = $path . 'test-php-exec.php';
            $success = @file_put_contents($test_file, $test_content);
            
            if ($success !== false) {
                @chmod($test_file, 0644);
                $results[$test_file] = true;
            } else {
                $results[$test_file] = false;
            }
            
            // Pour les sous-répertoires
            if (isset($info['subdirs'])) {
                foreach ($info['subdirs'] as $subpath => $subinfo) {
                    if ($subinfo['writable']) {
                        $sub_test_file = $subpath . 'test-php-exec.php';
                        $sub_success = @file_put_contents($sub_test_file, $test_content);
                        
                        if ($sub_success !== false) {
                            @chmod($sub_test_file, 0644);
                            $results[$sub_test_file] = true;
                        } else {
                            $results[$sub_test_file] = false;
                        }
                    }
                }
            }
        }
    }
    
    return $results;
}

// Résultat de l'analyse
$directory_structure = check_directories();
$test_files_created = try_create_test_files($directory_structure);

?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic des Chemins Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .box { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Diagnostic des Chemins Infomaniak</h1>
    
    <div class="box">
        <h2>Diagnostic de PHP</h2>
        <p>Version PHP: <strong><?php echo phpversion(); ?></strong></p>
        <p>Serveur: <strong><?php echo $_SERVER['SERVER_SOFTWARE']; ?></strong></p>
        <p>Document Root: <strong><?php echo $_SERVER['DOCUMENT_ROOT']; ?></strong></p>
        <p>Script Path: <strong><?php echo $_SERVER['SCRIPT_FILENAME']; ?></strong></p>
        <p>Répertoire courant: <strong><?php echo getcwd(); ?></strong></p>
    </div>
    
    <div class="box">
        <h2>Structure des Répertoires</h2>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%">
            <tr>
                <th>Chemin</th>
                <th>Existe</th>
                <th>Lisible</th>
                <th>Inscriptible</th>
            </tr>
            <?php foreach ($directory_structure as $path => $info): ?>
                <tr>
                    <td><?php echo htmlspecialchars($path); ?></td>
                    <td><?php echo $info['exists'] ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></td>
                    <td><?php echo $info['readable'] ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></td>
                    <td><?php echo $info['writable'] ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></td>
                </tr>
                <?php if (isset($info['subdirs'])): ?>
                    <?php foreach ($info['subdirs'] as $subpath => $subinfo): ?>
                        <tr>
                            <td style="padding-left: 30px">└─ <?php echo htmlspecialchars($subpath); ?></td>
                            <td><?php echo $subinfo['exists'] ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></td>
                            <td><?php echo $subinfo['readable'] ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></td>
                            <td><?php echo $subinfo['writable'] ? '<span class="success">Oui</span>' : '<span class="error">Non</span>'; ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            <?php endforeach; ?>
        </table>
    </div>
    
    <div class="box">
        <h2>Fichiers de Test PHP Créés</h2>
        <p>Ces fichiers ont été créés pour tester l'exécution PHP. Cliquez sur les liens pour vérifier si PHP s'exécute correctement.</p>
        <ul>
            <?php foreach ($test_files_created as $file => $success): ?>
                <li>
                    <?php if ($success): ?>
                        <a href="<?php echo str_replace($_SERVER['DOCUMENT_ROOT'], '', $file); ?>" target="_blank">
                            <?php echo htmlspecialchars($file); ?>
                        </a> - <span class="success">Créé avec succès</span>
                    <?php else: ?>
                        <?php echo htmlspecialchars($file); ?> - <span class="error">Échec de création</span>
                    <?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ul>
    </div>
    
    <div class="box">
        <h2>Solution possible pour le .htaccess</h2>
        <p>Si PHP ne s'exécute pas, essayez d'ajouter ce contenu dans un fichier .htaccess à la racine de votre site :</p>
        <pre>
AddHandler application/x-httpd-php .php
AddHandler fcgid-script .php
AddHandler php8-fcgi .php

&lt;FilesMatch "\.php$"&gt;
    SetHandler application/x-httpd-php
&lt;/FilesMatch&gt;

Options +ExecCGI
        </pre>
        
        <?php 
        // Tenter de créer un .htaccess à la racine
        $htaccess_content = "AddHandler application/x-httpd-php .php
AddHandler fcgid-script .php
AddHandler php8-fcgi .php

<FilesMatch \"\\.php$\">
    SetHandler application/x-httpd-php
</FilesMatch>

Options +ExecCGI";
        
        $root_dir = $_SERVER['DOCUMENT_ROOT'];
        $htaccess_file = $root_dir . '/.htaccess-new';
        $htaccess_success = @file_put_contents($htaccess_file, $htaccess_content);
        
        if ($htaccess_success !== false) {
            echo "<p class='success'>Un fichier .htaccess-new a été créé à la racine de votre site. Renommez-le en .htaccess pour l'activer.</p>";
        } else {
            echo "<p class='warning'>Impossible de créer automatiquement le fichier .htaccess. Créez-le manuellement avec le contenu ci-dessus.</p>";
        }
        ?>
    </div>
    
    <div class="box">
        <h2>Recommandations</h2>
        <ol>
            <li>Contactez le support Infomaniak et demandez-leur de vérifier que PHP est correctement activé pour votre hébergement.</li>
            <li>Utilisez le chemin correct détecté ci-dessus pour créer et déployer vos fichiers.</li>
            <li>Essayez de renommer le fichier .htaccess-new en .htaccess à la racine de votre site.</li>
            <li>Vérifiez dans le panneau d'administration Infomaniak que le type MIME pour .php est correctement configuré.</li>
        </ol>
    </div>
</body>
</html>
