
<?php
include_once '../utils/JwtHandler.php';

class Auth {
    protected $jwt;
    protected $headers;
    protected $token;

    public function __construct($headers) {
        $this->jwt = new JwtHandler();
        $this->headers = $headers;
    }

    /**
     * Vérifie si la requête est authentifiée
     * Retourne les données de l'utilisateur si oui, false sinon
     */
    public function isAuth() {
        // Vérifier l'en-tête d'autorisation standard
        if (isset($this->headers['Authorization'])) {
            $this->token = str_replace('Bearer ', '', $this->headers['Authorization']);
            $data = $this->jwt->decode($this->token);
            if ($data) {
                $this->logSuccessfulAuth($data);
                return $data;
            }
        }
        
        // Tentative alternative de récupération du token
        $token = $this->getBearerToken();
        if ($token) {
            $this->token = $token;
            $data = $this->jwt->decode($this->token);
            if ($data) {
                $this->logSuccessfulAuth($data);
                return $data;
            }
        }
        
        $this->logFailedAuth();
        return false;
    }
    
    /**
     * Journalise une authentification réussie
     */
    protected function logSuccessfulAuth($userData) {
        try {
            $logDir = __DIR__ . '/../logs';
            if (!file_exists($logDir)) {
                mkdir($logDir, 0755, true);
            }
            
            $user = isset($userData->user) ? json_encode($userData->user) : 'Pas d\'infos utilisateur';
            $deviceId = $this->getDeviceId();
            $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
            
            $logFile = $logDir . '/auth.log';
            $logData = date('Y-m-d H:i:s') . " | SUCCESS | IP: {$ip} | Device: {$deviceId} | User: {$user}" . PHP_EOL;
            file_put_contents($logFile, $logData, FILE_APPEND);
        } catch (Exception $e) {
            error_log("Erreur lors de la journalisation d'authentification: " . $e->getMessage());
        }
    }
    
    /**
     * Journalise une authentification échouée
     */
    protected function logFailedAuth() {
        try {
            $logDir = __DIR__ . '/../logs';
            if (!file_exists($logDir)) {
                mkdir($logDir, 0755, true);
            }
            
            $deviceId = $this->getDeviceId();
            $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
            $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : 'unknown';
            
            $logFile = $logDir . '/auth.log';
            $logData = date('Y-m-d H:i:s') . " | FAILED | IP: {$ip} | Device: {$deviceId} | URI: {$uri}" . PHP_EOL;
            file_put_contents($logFile, $logData, FILE_APPEND);
        } catch (Exception $e) {
            error_log("Erreur lors de la journalisation d'authentification: " . $e->getMessage());
        }
    }
    
    /**
     * Récupère l'ID de l'appareil client
     */
    public function getDeviceId() {
        // Vérifier dans les en-têtes HTTP
        if (isset($this->headers['X-Device-ID'])) {
            return $this->sanitizeDeviceId($this->headers['X-Device-ID']);
        }
        
        // Vérifier dans les paramètres GET
        if (isset($_GET['deviceId'])) {
            return $this->sanitizeDeviceId($_GET['deviceId']);
        }
        
        return 'unknown_device';
    }
    
    /**
     * Sanitize the device ID
     */
    protected function sanitizeDeviceId($deviceId) {
        return preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $deviceId);
    }
    
    /**
     * Récupère l'en-tête d'autorisation
     */
    public function getBearerToken() {
        $headers = $this->getAuthorizationHeader();
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }
    
    /**
     * Récupère les en-têtes d'autorisation
     */
    protected function getAuthorizationHeader() {
        $headers = null;
        if (isset($this->headers['Authorization'])) {
            $headers = trim($this->headers['Authorization']);
        } else if (isset($this->headers['authorization'])) {
            $headers = trim($this->headers['authorization']);
        } else if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER['Authorization']);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
        }
        
        return $headers;
    }
}

// Fonctions d'assistance pour récupérer les en-têtes d'autorisation
// (ces fonctions sont utiles pour les scripts qui n'utilisent pas la classe Auth)
function getAuthorizationHeader() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { // Nginx ou FastCGI
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    return $headers;
}

function getBearerToken() {
    $headers = getAuthorizationHeader();
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

/**
 * Récupère l'ID de l'appareil depuis les en-têtes HTTP ou les paramètres GET
 */
function getDeviceId() {
    // Vérifier dans les en-têtes HTTP
    $headers = getallheaders();
    if (isset($headers['X-Device-ID'])) {
        return sanitizeValue($headers['X-Device-ID']);
    }
    
    // Vérifier dans les paramètres GET
    if (isset($_GET['deviceId'])) {
        return sanitizeValue($_GET['deviceId']);
    }
    
    return 'unknown_device';
}

/**
 * Nettoie une valeur pour éviter les injections
 */
function sanitizeValue($value) {
    return preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $value);
}
?>
