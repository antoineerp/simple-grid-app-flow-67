
<?php
class AuthenticationService {
    private $database;
    private $jwt;

    public function __construct($database = null, $jwt = null) {
        $this->database = $database ?? new Database();
        $this->jwt = $jwt ?? new JwtHandler();
    }

    public function authenticate($username, $password) {
        error_log("Tentative d'authentification pour: " . $username);
        
        // Tenter une connexion à la base de données
        try {
            $db = $this->database->getConnection(true);
            
            if ($this->database->is_connected) {
                $user = $this->findUser($db, $username);
                
                if ($user) {
                    if ($this->verifyPassword($user, $password)) {
                        return $this->generateSuccessResponse($user);
                    }
                }
            }
        } catch (Exception $e) {
            error_log("Erreur d'authentification: " . $e->getMessage());
            throw $e;
        }
        
        return false;
    }

    private function findUser($db, $username) {
        $query = "SELECT id, nom, prenom, email, mot_de_passe, identifiant_technique, role 
                 FROM utilisateurs 
                 WHERE identifiant_technique = ? OR email = ?";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$username, $username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function verifyPassword($user, $password) {
        // Pour l'utilisateur p71x6d_system, accepter le mot de passe spécial
        if ($user['identifiant_technique'] === 'p71x6d_system' && $password === 'Trottinette43!') {
            error_log("Mot de passe spécial accepté pour p71x6d_system");
            return true;
        }
        
        // Vérifier le mot de passe avec password_verify
        if (password_verify($password, $user['mot_de_passe'])) {
            error_log("Mot de passe vérifié avec succès via password_verify()");
            return true;
        }
        
        // Comparaison directe pour les mots de passe non hachés
        if ($password === $user['mot_de_passe']) {
            error_log("Mot de passe vérifié avec succès via comparaison directe");
            return true;
        }

        return false;
    }

    private function generateSuccessResponse($user) {
        $token_data = [
            'id' => $user['id'],
            'identifiant_technique' => $user['identifiant_technique'],
            'role' => $user['role']
        ];
        
        $token = $this->jwt->encode($token_data);
        
        return [
            'message' => 'Connexion réussie',
            'token' => $token,
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
