
<?php
require_once dirname(__DIR__) . '/../utils/ResponseHandler.php';
require_once dirname(__DIR__) . '/../models/User.php';

class UserPostHandler {
    private $user;

    public function __construct($user) {
        $this->user = $user;
    }

    public function handle() {
        try {
            $inputData = file_get_contents("php://input");
            if (empty($inputData)) {
                error_log("UserPostHandler: Aucune donnée reçue");
                ResponseHandler::error("Aucune donnée reçue", 400);
                return;
            }
            
            error_log("UserPostHandler - Données reçues POST: " . $inputData);
            
            $data = json_decode($inputData);
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("UserPostHandler - Erreur de décodage JSON: " . json_last_error_msg());
                ResponseHandler::error("Erreur de décodage JSON: " . json_last_error_msg(), 400);
                return;
            }
            
            // Journaliser les données reçues (en masquant le mot de passe)
            $logData = clone $data;
            if (isset($logData->mot_de_passe)) $logData->mot_de_passe = "******";
            error_log("UserPostHandler - Données décodées: " . json_encode($logData));
            
            if (!$this->validateUserData($data)) {
                error_log("UserPostHandler - Données incomplètes pour la création de l'utilisateur");
                ResponseHandler::error("Données incomplètes pour la création de l'utilisateur", 400);
                return;
            }

            // Vérifier si un gestionnaire existe déjà avant de créer un nouveau
            if (isset($data->role) && $data->role === 'gestionnaire' && $this->user->countUsersByRole('gestionnaire') > 0) {
                error_log("UserPostHandler - Tentative de création d'un second gestionnaire");
                ResponseHandler::error("Un seul compte gestionnaire peut être créé", 409);
                return;
            }

            // Vérifier si l'email existe déjà
            if ($this->user->emailExists($data->email)) {
                error_log("UserPostHandler - Email déjà utilisé: " . $data->email);
                ResponseHandler::error("Email déjà utilisé", 409);
                return;
            }

            // Assigner les données utilisateur
            $this->assignUserData($data);

            // Créer l'utilisateur
            if ($this->user->create()) {
                $lastId = $this->user->conn->lastInsertId();
                error_log("UserPostHandler - Utilisateur créé avec succès, ID: " . $lastId);
                
                // Initialiser les données utilisateur si c'est un utilisateur normal
                if (isset($data->role) && $data->role === 'utilisateur') {
                    $this->user->initializeUserDataFromManager($lastId);
                }
                
                ResponseHandler::success(
                    ['id' => $lastId, 'identifiant_technique' => $data->identifiant_technique],
                    "Utilisateur créé avec succès",
                    201
                );
            } else {
                error_log("UserPostHandler - Erreur lors de la création de l'utilisateur");
                ResponseHandler::error("Erreur lors de la création de l'utilisateur", 500);
            }
        } catch (Exception $e) {
            error_log("UserPostHandler - Exception: " . $e->getMessage() . " à la ligne " . $e->getLine() . " dans " . $e->getFile());
            error_log("UserPostHandler - Trace: " . $e->getTraceAsString());
            ResponseHandler::error("Erreur lors de la création de l'utilisateur: " . $e->getMessage(), 500);
        }
    }

    private function validateUserData($data) {
        // Vérifier si toutes les propriétés requises existent
        $requiredProperties = ['nom', 'prenom', 'email', 'identifiant_technique', 'mot_de_passe', 'role'];
        foreach ($requiredProperties as $prop) {
            if (!isset($data->$prop) || empty($data->$prop)) {
                error_log("UserPostHandler - Validation: propriété manquante ou vide: " . $prop);
                return false;
            }
        }
        return true;
    }

    private function assignUserData($data) {
        $this->user->nom = $data->nom;
        $this->user->prenom = $data->prenom;
        $this->user->email = $data->email;
        $this->user->identifiant_technique = $data->identifiant_technique;
        $this->user->mot_de_passe = $data->mot_de_passe;
        $this->user->role = $data->role;
    }
}
?>
