
<?php
// Script simple pour identifier le répertoire home sur Infomaniak
header("Content-Type: text/plain");

echo "=== Informations sur les répertoires ===\n\n";
echo "Script actuel: " . __FILE__ . "\n";
echo "Document root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Répertoire courant: " . getcwd() . "\n\n";

echo "=== Recherche du répertoire home ===\n\n";
$possible_homes = [
    '/home',
    '/home/clients',
    '/var/www',
    '/srv',
    '/var/www/html',
    '/var/www/vhosts',
];

foreach ($possible_homes as $path) {
    if (is_dir($path)) {
        echo "$path : EXISTE\n";
        
        // Si c'est /home/clients, lister les sous-répertoires
        if ($path == '/home/clients' && is_readable($path)) {
            $dirs = scandir($path);
            echo "  Sous-répertoires:\n";
            foreach ($dirs as $dir) {
                if ($dir != '.' && $dir != '..' && is_dir("$path/$dir")) {
                    echo "  - $path/$dir\n";
                    
                    // Vérifier s'il y a un dossier 'sites' ou 'www'
                    if (is_dir("$path/$dir/sites")) {
                        echo "    > $path/$dir/sites (TROUVÉ)\n";
                        $site_dirs = scandir("$path/$dir/sites");
                        foreach ($site_dirs as $site) {
                            if ($site != '.' && $site != '..' && is_dir("$path/$dir/sites/$site")) {
                                echo "      * $site\n";
                            }
                        }
                    }
                    
                    if (is_dir("$path/$dir/www")) {
                        echo "    > $path/$dir/www (TROUVÉ)\n";
                    }
                }
            }
        }
    } else {
        echo "$path : N'EXISTE PAS\n";
    }
}

echo "\n=== Variables d'environnement ===\n\n";
$env_vars = ['HOME', 'USER', 'DOCUMENT_ROOT', 'SERVER_NAME'];
foreach ($env_vars as $var) {
    if (isset($_SERVER[$var])) {
        echo "$var: " . $_SERVER[$var] . "\n";
    } else if (getenv($var) !== false) {
        echo "$var: " . getenv($var) . "\n";
    } else {
        echo "$var: Non défini\n";
    }
}
