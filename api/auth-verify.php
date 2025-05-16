
<?php
// Fonction pour vérifier la validité du token JWT
function isTokenValid() {
    $headers = getallheaders();
    $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (empty($auth_header) || strpos($auth_header, 'Bearer ') !== 0) {
        return false;
    }
    
    $token = substr($auth_header, 7); // Retirer "Bearer " du début
    
    // Diviser le token en 3 parties
    $parts = explode('.', $token);
    
    if (count($parts) !== 3) {
        return false;
    }
    
    list($header, $payload, $signature) = $parts;
    
    // Décoder le payload
    $payload_data = json_decode(base64UrlDecode($payload), true);
    
    if (!$payload_data) {
        return false;
    }
    
    // Vérifier si le token a expiré
    if (isset($payload_data['exp']) && $payload_data['exp'] < time()) {
        return false;
    }
    
    // Vérifier que les données utilisateur sont présentes
    if (!isset($payload_data['user']) || !isset($payload_data['user']['id'])) {
        return false;
    }
    
    return true;
}

// Fonction pour obtenir les données du token
function getTokenData() {
    $headers = getallheaders();
    $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (empty($auth_header) || strpos($auth_header, 'Bearer ') !== 0) {
        return null;
    }
    
    $token = substr($auth_header, 7); // Retirer "Bearer " du début
    
    // Diviser le token en 3 parties
    $parts = explode('.', $token);
    
    if (count($parts) !== 3) {
        return null;
    }
    
    list($header, $payload, $signature) = $parts;
    
    // Décoder le payload
    return json_decode(base64UrlDecode($payload), true);
}

// Fonction pour décoder base64url
function base64UrlDecode($input) {
    $remainder = strlen($input) % 4;
    if ($remainder) {
        $input .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($input, '-_', '+/'));
}
?>
