
<?php
// Protection par clé d'accès
$validAccessKey = "BG7x9pL2zQj5KmRd"; // Remplacez ceci par une clé sécurisée

// Vérifier si la clé d'accès est fournie et valide
$accessKey = isset($_GET['key']) ? $_GET['key'] : '';

if ($accessKey !== $validAccessKey) {
    header('HTTP/1.0 403 Forbidden');
    echo "Accès refusé";
    exit;
}

// Exécuter le script de surveillance des tables
include_once __DIR__ . '/../utils/table_monitor.php';
?>
