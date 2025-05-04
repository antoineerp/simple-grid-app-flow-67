
<?php
class RequestHandler {
    /**
     * Définit les en-têtes standard pour éviter les problèmes CORS
     */
    public static function setStandardHeaders($allowedMethods = "GET, POST, OPTIONS") {
        header('Content-Type: application/json; charset=UTF-8');
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: {$allowedMethods}");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Device-ID");
        header("Cache-Control: no-cache, no-store, must-revalidate");
    }
    
    /**
     * Gère les requêtes OPTIONS pour le preflight CORS
     */
    public static function handleOptionsRequest() {
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Preflight OK']);
            exit;
        }
    }
    
    /**
     * Sanitize user ID to prevent SQL injection
     */
    public static function sanitizeUserId($userId) {
        return preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $userId);
    }
    
    /**
     * Récupère l'identifiant de l'appareil à partir des en-têtes
     */
    public static function getDeviceId() {
        $headers = getallheaders();
        $deviceId = isset($headers['X-Device-ID']) ? $headers['X-Device-ID'] : null;
        
        if (!$deviceId) {
            $deviceId = isset($_SERVER['HTTP_X_DEVICE_ID']) ? $_SERVER['HTTP_X_DEVICE_ID'] : null;
        }
        
        if (!$deviceId) {
            $deviceId = uniqid('unknown_device_', true);
        }
        
        return self::sanitizeUserId($deviceId);
    }
    
    /**
     * Prépare et renvoie une réponse JSON standard
     */
    public static function sendJsonResponse($success, $message, $data = null) {
        $response = [
            'success' => $success,
            'message' => $message,
            'timestamp' => date('c')
        ];
        
        if ($data !== null) {
            $response = array_merge($response, $data);
        }
        
        echo json_encode($response);
    }
    
    /**
     * Gère les erreurs de manière uniforme
     */
    public static function handleError($error, $code = 400) {
        error_log("Erreur dans l'API: " . (is_string($error) ? $error : (
            $error instanceof Exception ? $error->getMessage() : json_encode($error)
        )));
        
        http_response_code($code);
        
        $errorMessage = "";
        if (is_string($error)) {
            $errorMessage = $error;
        } elseif ($error instanceof Exception) {
            $errorMessage = $error->getMessage();
            // Ajouter la trace pour le débogage
            error_log("Trace: " . $error->getTraceAsString());
        } else {
            $errorMessage = "Erreur inconnue";
        }
        
        self::sendJsonResponse(false, $errorMessage, [
            'code' => $code,
            'debug_info' => defined('DEBUG_MODE') && DEBUG_MODE ? (
                $error instanceof Exception ? [
                    'file' => $error->getFile(),
                    'line' => $error->getLine(),
                    'trace' => explode("\n", $error->getTraceAsString())
                ] : []
            ) : null
        ]);
        
        // S'assurer que la sortie est envoyée et que le script se termine
        if (ob_get_level()) ob_end_flush();
        exit;
    }

    /**
     * Force l'enregistrement d'une opération de synchronisation
     * Utile pour déboguer et s'assurer que les opérations sont correctement enregistrées
     */
    public static function forceSyncRecord($pdo, $tableName, $userId, $deviceId, $operation = 'sync', $recordCount = 0) {
        try {
            error_log("Force d'enregistrement de l'opération {$operation} pour la table {$tableName}");
            
            // Créer la table d'historique si elle n'existe pas
            $pdo->exec("CREATE TABLE IF NOT EXISTS `sync_history` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `table_name` VARCHAR(100) NOT NULL,
                `user_id` VARCHAR(50) NOT NULL,
                `device_id` VARCHAR(100) NOT NULL,
                `record_count` INT NOT NULL,
                `operation` VARCHAR(50) DEFAULT 'sync',
                `sync_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX `idx_user_device` (`user_id`, `device_id`),
                INDEX `idx_table_user` (`table_name`, `user_id`),
                INDEX `idx_timestamp` (`sync_timestamp`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            
            // Insérer l'enregistrement directement
            $stmt = $pdo->prepare("INSERT INTO `sync_history` 
                                (table_name, user_id, device_id, record_count, operation, sync_timestamp) 
                                VALUES (?, ?, ?, ?, ?, NOW())");
            $stmt->execute([$tableName, $userId, $deviceId, $recordCount, $operation]);
            
            return true;
        } catch (Exception $e) {
            error_log("Erreur lors de l'enregistrement forcé de l'opération {$operation}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Nettoyer les entrées dupliquées dans l'historique de synchronisation
     */
    public static function cleanupSyncDuplicates($pdo, $userId = null) {
        try {
            // Requête pour identifier les doublons
            $query = "SELECT id, table_name, user_id, device_id, operation, sync_timestamp
                     FROM sync_history 
                     WHERE id NOT IN (
                        SELECT MIN(id) 
                        FROM sync_history 
                        GROUP BY table_name, user_id, device_id, operation, DATE(sync_timestamp)
                     )";
            
            // Si un userId est spécifié, limiter aux entrées de cet utilisateur
            $params = [];
            if ($userId) {
                $query .= " AND user_id = ?";
                $params[] = $userId;
            }
            
            // Identifier les entrées à supprimer
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($duplicates) > 0) {
                // Récupérer les IDs à supprimer
                $idsToDelete = array_map(function($entry) {
                    return $entry['id'];
                }, $duplicates);
                
                // Supprimer les doublons
                $deleteQuery = "DELETE FROM sync_history WHERE id IN (" . implode(",", $idsToDelete) . ")";
                $pdo->exec($deleteQuery);
                
                error_log("Nettoyage de l'historique: " . count($duplicates) . " doublons supprimés");
                return count($duplicates);
            }
            
            return 0;
        } catch (Exception $e) {
            error_log("Erreur lors du nettoyage des doublons: " . $e->getMessage());
            return -1;
        }
    }
}
