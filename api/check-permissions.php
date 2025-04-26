
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour vérifier les permissions
function checkPermissions($path) {
    $info = [];
    $info['path'] = $path;
    $info['exists'] = file_exists($path);
    $info['readable'] = is_readable($path);
    $info['writable'] = is_writable($path);
    $info['executable'] = is_executable($path);
    return $info;
}

// Chemins à vérifier
$pathsToCheck = [
    __DIR__,
    __DIR__ . '/config',
    __DIR__ . '/middleware',
    __DIR__ . '/.htaccess',
    __DIR__ . '/index.php'
];

$results = [];
foreach ($pathsToCheck as $path) {
    $results[] = checkPermissions($path);
}

echo "<!DOCTYPE html><html><body>";
echo "<h1>Diagnostic des Permissions</h1>";
echo "<table border='1'><tr><th>Chemin</th><th>Existe</th><th>Lisible</th><th>Modifiable</th><th>Exécutable</th></tr>";
foreach ($results as $result) {
    echo "<tr>";
    echo "<td>{$result['path']}</td>";
    echo "<td>" . ($result['exists'] ? '✅' : '❌') . "</td>";
    echo "<td>" . ($result['readable'] ? '✅' : '❌') . "</td>";
    echo "<td>" . ($result['writable'] ? '✅' : '❌') . "</td>";
    echo "<td>" . ($result['executable'] ? '✅' : '❌') . "</td>";
    echo "</tr>";
}
echo "</table></body></html>";
?>
