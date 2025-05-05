
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

    public function isAuth() {
        if (isset($this->headers['Authorization'])) {
            $this->token = str_replace('Bearer ', '', $this->headers['Authorization']);
            $data = $this->jwt->decode($this->token);
            if ($data) {
                return $data;
            }
            return false;
        }
        
        // Tentative alternative de récupération du token
        $token = $this->getBearerToken();
        if ($token) {
            $this->token = $token;
            $data = $this->jwt->decode($this->token);
            if ($data) {
                return $data;
            }
        }
        
        return false;
    }
    
    // Fonction pour obtenir l'en-tête d'autorisation
    public function getBearerToken() {
        $headers = $this->getAuthorizationHeader();
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }
    
    // Fonction pour obtenir les en-têtes HTTP
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
?>
