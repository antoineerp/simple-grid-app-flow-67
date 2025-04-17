
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
        return false;
    }
}

// Fonction pour obtenir les en-têtes HTTP
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

// Fonction pour obtenir l'en-tête d'autorisation
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
