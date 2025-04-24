
<?php
class RequestValidator {
    public static function validateAuthRequest() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            error_log("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
            http_response_code(405);
            return [
                'isValid' => false,
                'message' => 'Méthode non autorisée. Utilisez POST pour l\'authentification.',
                'status' => 405
            ];
        }

        $json_input = file_get_contents("php://input");
        if (empty($json_input)) {
            error_log("Aucune donnée reçue");
            return [
                'isValid' => false,
                'message' => 'Aucune donnée reçue',
                'status' => 400
            ];
        }

        $data = json_decode(self::cleanUTF8($json_input));
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("Erreur de décodage JSON: " . json_last_error_msg());
            return [
                'isValid' => false,
                'message' => 'Erreur de décodage JSON: ' . json_last_error_msg(),
                'status' => 400
            ];
        }

        if (empty($data->username) || empty($data->password)) {
            error_log("Données incomplètes pour la connexion");
            return [
                'isValid' => false,
                'message' => 'Données incomplètes',
                'status' => 400
            ];
        }

        return [
            'isValid' => true,
            'data' => $data
        ];
    }

    private static function cleanUTF8($input) {
        if (is_string($input)) {
            return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
        } elseif (is_array($input)) {
            foreach ($input as $key => $value) {
                $input[$key] = self::cleanUTF8($value);
            }
        }
        return $input;
    }
}
?>
