
<?php
// En-têtes pour JSON et CORS
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

// Tester l'exécution PHP de base
$result = [
    'test_name' => 'PHP Execution Test',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'execution_status' => 'success',
    'server_info' => [
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'name' => $_SERVER['SERVER_NAME'] ?? 'Unknown',
        'script' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown'
    ],
    'tests' => []
];

// Test 1: Variables
$test1 = 'Variable test value';
$result['tests']['variables'] = [
    'status' => 'success',
    'value' => $test1
];

// Test 2: Fonctions
function testFunction() {
    return "Function output";
}
$result['tests']['functions'] = [
    'status' => 'success',
    'value' => testFunction()
];

// Test 3: Calculs
$a = 10;
$b = 20;
$result['tests']['calculations'] = [
    'status' => 'success',
    'values' => [
        'a' => $a,
        'b' => $b,
        'a + b' => $a + $b,
        'a * b' => $a * b
    ]
];

// Test 4: Inclusion de fichier
$includeTest = [];
try {
    if (file_exists(__DIR__ . '/test.php')) {
        $includeTest['status'] = 'success';
        $includeTest['message'] = 'test.php exists and can be included';
    } else {
        $includeTest['status'] = 'warning';
        $includeTest['message'] = 'test.php does not exist';
    }
} catch (Exception $e) {
    $includeTest['status'] = 'error';
    $includeTest['message'] = $e->getMessage();
}
$result['tests']['file_inclusion'] = $includeTest;

// Test 5: Accès à la base de données
$dbTest = [];
if (extension_loaded('pdo_mysql')) {
    $dbTest['pdo_mysql'] = 'available';
    try {
        // Note: juste tester la disponibilité de PDO, pas de connexion réelle
        $dbTest['status'] = 'available';
    } catch (Exception $e) {
        $dbTest['status'] = 'error';
        $dbTest['message'] = $e->getMessage();
    }
} else {
    $dbTest['pdo_mysql'] = 'not available';
    $dbTest['status'] = 'error';
}
$result['tests']['database'] = $dbTest;

// Test 6: Vérification des chemins Infomaniak
$infomaniakTest = [];
$expectedPath = '/sites/qualiopi.ch';
if (file_exists($expectedPath)) {
    $infomaniakTest['status'] = 'success';
    $infomaniakTest['message'] = 'Le chemin Infomaniak standard existe';
    $infomaniakTest['path'] = $expectedPath;
} else {
    $infomaniakTest['status'] = 'warning';
    $infomaniakTest['message'] = 'Le chemin Infomaniak standard n\'existe pas';
    $infomaniakTest['path'] = $expectedPath;
}
$result['tests']['infomaniak_paths'] = $infomaniakTest;

// Réponse JSON
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
