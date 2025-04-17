
<?php
class JwtHandler {
    protected $secret_key = "votre_cle_secrete_jwt"; // À changer pour une clé sécurisée en production
    protected $algorithm = 'HS256';
    protected $issuedAt;
    protected $expire;

    public function __construct() {
        // Définir l'heure d'émission
        $this->issuedAt = time();
        
        // Définir l'heure d'expiration (1 jour)
        $this->expire = $this->issuedAt + 86400; // 24 heures
    }

    // Fonction pour encoder le token
    public function encode($data) {
        $token = array(
            "iat" => $this->issuedAt,
            "exp" => $this->expire,
            "data" => $data
        );

        return $this->base64UrlEncode(json_encode($token)) . "." . 
               $this->base64UrlEncode(json_encode(["alg" => $this->algorithm])) . "." .
               $this->base64UrlEncode($this->sign($token));
    }

    // Fonction pour décoder le token
    public function decode($jwt_token) {
        // Diviser le token en ses composants
        $token_parts = explode('.', $jwt_token);
        
        if (count($token_parts) !== 3) {
            return false;
        }

        $payload = json_decode($this->base64UrlDecode($token_parts[0]), true);
        $header = json_decode($this->base64UrlDecode($token_parts[1]), true);
        $signature = $this->base64UrlDecode($token_parts[2]);

        // Vérifier si le token a expiré
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }

        // Vérifier la signature
        $expected_signature = $this->sign($payload);
        if ($signature !== $expected_signature) {
            return false;
        }

        return $payload;
    }

    // Fonction pour signer les données
    private function sign($data) {
        return hash_hmac('sha256', json_encode($data), $this->secret_key);
    }

    // Encodage Base64URL
    private function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    // Décodage Base64URL
    private function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
?>
