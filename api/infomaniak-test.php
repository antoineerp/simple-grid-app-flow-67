
<?php
// Fichier de test rapide pour la connexion Infomaniak
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Inclure le fichier de connexion directe
require_once 'db-connection-direct.php';

try {
    // Tester la connexion
    $connectionSuccess = testInfomaniakConnection();
    
    if ($connectionSuccess) {
        // Si la connexion réussit, renvoyer un message de succès
        echo json_encode([
            'status' => 'success',
            'message' => 'Connexion à la base de données Infomaniak établie avec succès',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        // Si la connexion échoue, renvoyer un message d'erreur
        echo json_encode([
            'status' => 'error',
            'message' => 'Échec de la connexion à la base de données Infomaniak',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
} catch (Exception $e) {
    // En cas d'erreur, renvoyer le message d'erreur
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du test de connexion: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
