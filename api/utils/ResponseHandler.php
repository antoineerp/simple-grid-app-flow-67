
<?php
class ResponseHandler {
    public static function success($data = null, $message = '', $code = 200) {
        // S'assurer qu'aucun contenu n'a été envoyé avant
        if (ob_get_level()) {
            ob_clean();
        }
        
        if (!headers_sent()) {
            http_response_code($code);
            header('Content-Type: application/json; charset=UTF-8');
        }
        
        $response = [
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ];
        
        // Nettoyer la sortie si elle contient des objets non sérialisables
        if (is_array($response['data'])) {
            array_walk_recursive($response['data'], function (&$item) {
                if (is_object($item) && !method_exists($item, '__toString')) {
                    $item = get_class($item);
                }
            });
        }
        
        // Journaliser la réponse
        error_log("Réponse réussie: " . json_encode($response));
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function error($message, $code = 400, $details = null) {
        // S'assurer qu'aucun contenu n'a été envoyé avant
        if (ob_get_level()) {
            ob_clean();
        }
        
        if (!headers_sent()) {
            http_response_code($code);
            header('Content-Type: application/json; charset=UTF-8');
        }
        
        $response = [
            'status' => 'error',
            'message' => $message
        ];
        
        if ($details) {
            $response['details'] = $details;
        }
        
        // Journaliser l'erreur
        error_log("Réponse d'erreur: " . json_encode($response, JSON_UNESCAPED_UNICODE));
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function databaseStatus() {
        try {
            // Tester la connexion PDO directement
            $host = "p71x6d.myd.infomaniak.com";
            $dbname = "p71x6d_system";
            $username = "p71x6d_system";
            $password = "Trottinette43!";
            
            $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            error_log("ResponseHandler: Vérification de la connexion à la base de données");
            $pdo = new PDO($dsn, $username, $password, $options);
            
            // Vérifier que la connexion fonctionne en exécutant une requête
            $stmt = $pdo->query("SELECT DATABASE() as db");
            $result = $stmt->fetch();
            
            // Récupérer le nombre de tables
            $tablesStmt = $pdo->query("SHOW TABLES");
            $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);
            
            return [
                'status' => 'success',
                'message' => 'Connexion à la base de données établie',
                'connection_info' => [
                    'host' => $host,
                    'database' => $dbname,
                    'user' => $username,
                    'current_db' => $result['db'] ?? $dbname,
                    'tables_count' => count($tables),
                ],
                'is_connected' => true
            ];
        } catch (PDOException $e) {
            error_log("ResponseHandler: Erreur de connexion à la base de données: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Échec de la connexion à la base de données',
                'error' => $e->getMessage(),
                'is_connected' => false
            ];
        }
    }
}
?>
