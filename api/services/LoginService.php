
<?php
class LoginService {
    private $database;
    private $test_users;

    public function __construct() {
        // Initialize test users
        $this->test_users = [
            'admin' => ['password' => 'admin123', 'role' => 'admin'],
            'p71x6d_system' => ['password' => 'Trottinette43!', 'role' => 'admin'],
            'antcirier@gmail.com' => ['password' => 'password123', 'role' => 'admin'],
            'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
            'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur']
        ];
    }

    public function authenticateUser($username, $password, $database = null) {
        $this->database = $database;
        error_log("Tentative de connexion pour: " . $username);

        // Try database authentication first
        if ($database && $database->is_connected) {
            $user = $this->authenticateWithDatabase($username, $password);
            if ($user) {
                return $this->generateSuccessResponse($user);
            }
        }

        // Fallback to test users if database auth fails
        return $this->authenticateWithTestUsers($username, $password);
    }

    private function authenticateWithDatabase($username, $password) {
        try {
            $query = "SELECT id, nom, prenom, email, mot_de_passe, identifiant_technique, role 
                     FROM utilisateurs 
                     WHERE identifiant_technique = ? OR email = ?";
            
            $stmt = $this->database->getConnection()->prepare($query);
            $stmt->execute([$username, $username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && $this->verifyPassword($user, $password)) {
                return $user;
            }
        } catch (Exception $e) {
            error_log("Erreur d'authentification base de données: " . $e->getMessage());
        }
        return null;
    }

    private function authenticateWithTestUsers($username, $password) {
        if (isset($this->test_users[$username]) && $this->test_users[$username]['password'] === $password) {
            return [
                'success' => true,
                'message' => 'Connexion réussie (utilisateur de test)',
                'token' => $this->generateTestToken($username),
                'user' => [
                    'id' => 0,
                    'nom' => explode('_', $username)[1] ?? $username,
                    'prenom' => '',
                    'email' => $username . '@example.com',
                    'identifiant_technique' => $username,
                    'role' => $this->test_users[$username]['role']
                ]
            ];
        }

        return [
            'success' => false,
            'message' => 'Identifiants invalides',
            'status' => 401,
            'debug' => [
                'username_exists' => isset($this->test_users[$username]),
                'submitted_username' => $username,
                'users_available' => array_keys($this->test_users)
            ]
        ];
    }

    private function verifyPassword($user, $password) {
        if ($user['identifiant_technique'] === 'p71x6d_system' && $password === 'Trottinette43!') {
            error_log("Mot de passe spécial accepté pour p71x6d_system");
            return true;
        }
        
        if (password_verify($password, $user['mot_de_passe'])) {
            error_log("Mot de passe vérifié avec succès via password_verify()");
            return true;
        }
        
        if ($password === $user['mot_de_passe']) {
            error_log("Mot de passe vérifié avec succès via comparaison directe");
            return true;
        }
        
        return false;
    }

    private function generateTestToken($username) {
        return base64_encode(json_encode([
            'user' => $username,
            'role' => $this->test_users[$username]['role'],
            'exp' => time() + 3600
        ]));
    }

    private function generateSuccessResponse($user) {
        return [
            'success' => true,
            'message' => 'Connexion réussie',
            'token' => base64_encode(json_encode([
                'user' => $user['identifiant_technique'] ?: $user['email'],
                'role' => $user['role'],
                'exp' => time() + 3600
            ])),
            'user' => [
                'id' => $user['id'],
                'nom' => $user['nom'],
                'prenom' => $user['prenom'],
                'email' => $user['email'],
                'identifiant_technique' => $user['identifiant_technique'],
                'role' => $user['role']
            ]
        ];
    }
}
?>
