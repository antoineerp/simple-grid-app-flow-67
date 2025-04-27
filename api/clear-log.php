
<?php
// Fichier pour effacer le fichier de log des erreurs
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Vérifier le fichier de log
$log_file = __DIR__ . '/php_errors.log';
$result = [
    'status' => 'success',
    'action' => 'clear_log',
    'timestamp' => date('Y-m-d H:i:s')
];

if (file_exists($log_file)) {
    // Tenter d'effacer le contenu du fichier
    if (is_writable($log_file)) {
        file_put_contents($log_file, '');
        $result['message'] = 'Le fichier de log a été vidé avec succès';
    } else {
        $result['status'] = 'error';
        $result['message'] = 'Le fichier de log existe mais n\'est pas accessible en écriture';
    }
} else {
    // Créer un nouveau fichier de log vide
    try {
        file_put_contents($log_file, '');
        $result['message'] = 'Un nouveau fichier de log vide a été créé';
    } catch (Exception $e) {
        $result['status'] = 'error';
        $result['message'] = 'Impossible de créer le fichier de log: ' . $e->getMessage();
    }
}

// Vérifier à nouveau le fichier
$result['file_exists'] = file_exists($log_file);
$result['file_writable'] = is_writable($log_file);
$result['file_size'] = file_exists($log_file) ? filesize($log_file) : 0;
$result['file_path'] = $log_file;

echo json_encode($result, JSON_PRETTY_PRINT);
?>
