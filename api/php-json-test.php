
<?php
// Définir le type de contenu en tant que JSON
header("Content-Type: application/json; charset=UTF-8");

// Envoyer une réponse JSON simple
echo json_encode([
    'status' => 'success',
    'message' => 'PHP fonctionne correctement et renvoie du JSON',
    'php_version' => phpversion(),
    'server_info' => [
        'software' => $_SERVER['SERVER_SOFTWARE'],
        'method' => $_SERVER['REQUEST_METHOD'],
        'time' => date('Y-m-d H:i:s')
    ]
]);
?>
