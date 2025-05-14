
<?php
header('Content-Type: text/plain; charset=utf-8');

echo "=== Test PHP simple ===\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n";
echo "PHP version: " . phpversion() . "\n\n";

echo "=== Chemins ===\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Script filename: " . $_SERVER['SCRIPT_FILENAME'] . "\n";
echo "Current directory: " . getcwd() . "\n\n";

echo "=== Structure Infomaniak détectée ===\n";
$client_path = '/home/clients/df8dceff557ccc0605d45e1581aa661b';
$site_path = '/sites/qualiopi.ch';

echo "Client path exists: " . (is_dir($client_path) ? 'OUI' : 'NON') . "\n";
echo "Site path exists: " . (is_dir($site_path) ? 'OUI' : 'NON') . "\n";

// Tester les combinaisons possibles
$combinations = [
    $client_path,
    $client_path . '/sites/qualiopi.ch',
    $site_path,
    '/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch'
];

echo "\n=== Test des combinaisons de chemins ===\n";
foreach ($combinations as $path) {
    echo "$path: " . (is_dir($path) ? 'Existe' : 'N\'existe pas') . "\n";
}

// Vérifier la configuration
echo "\n=== Vérification de la configuration ===\n";
echo "Auto prepend file: " . ini_get('auto_prepend_file') . "\n";
echo "Include path: " . ini_get('include_path') . "\n";

// Vérifier l'accès au répertoire api
$api_exists = is_dir('api');
echo "\nDossier API dans le répertoire courant: " . ($api_exists ? 'OUI' : 'NON') . "\n";

if ($api_exists) {
    $api_files = scandir('api');
    echo "Fichiers dans le dossier API: " . implode(', ', array_slice($api_files, 0, 10)) . "\n";
}

echo "\n=== Fin du test ===\n";
?>
