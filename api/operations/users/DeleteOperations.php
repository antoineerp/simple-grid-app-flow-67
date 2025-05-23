
<?php
require_once dirname(dirname(__FILE__)) . '/BaseOperations.php';

class UserDeleteOperations extends BaseOperations {
    public function handleDeleteRequest() {
        // Nettoyer tout buffer de sortie existant
        if (ob_get_level()) ob_clean();
        
        // Assurez-vous que les headers sont configurés correctement
        header('Content-Type: application/json; charset=UTF-8');
        
        // Journaliser l'appel pour le débogage
        error_log("UserDeleteOperations::handleDeleteRequest - Début");
        
        try {
            // Récupérer les données DELETE
            $json_data = file_get_contents("php://input");
            error_log("UserDeleteOperations - Données DELETE brutes: " . $json_data);
            
            if (empty($json_data)) {
                ResponseHandler::error("Aucune donnée reçue", 400);
                return;
            }
            
            $data = json_decode($json_data);
            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHandler::error("JSON invalide: " . json_last_error_msg(), 400);
                return;
            }
            
            // Vérifier que l'ID est présent
            if (!isset($data->id)) {
                ResponseHandler::error("ID de l'utilisateur non spécifié", 400);
                return;
            }
            
            // Récupérer l'utilisateur existant
            $user = $this->model->findById($data->id);
            if (!$user) {
                ResponseHandler::error("Utilisateur non trouvé", 404);
                return;
            }
            
            // Supprimer toutes les tables associées à cet utilisateur
            try {
                $this->deleteUserTables($user->identifiant_technique);
            } catch (PDOException $e) {
                error_log("Erreur lors de la suppression des tables: " . $e->getMessage());
                // On continue malgré l'erreur de suppression des tables
            }
            
            // Supprimer l'utilisateur
            try {
                $this->model->id = $data->id;
                if ($this->model->delete()) {
                    ResponseHandler::success([
                        "message" => "Utilisateur supprimé avec succès",
                        "id" => $data->id
                    ]);
                } else {
                    ResponseHandler::error("Impossible de supprimer l'utilisateur", 500);
                }
            } catch (PDOException $e) {
                error_log("Erreur SQL lors de la suppression de l'utilisateur: " . $e->getMessage());
                ResponseHandler::error("Erreur SQL: " . $e->getMessage(), 500);
            }
        } catch (Exception $e) {
            error_log("UserDeleteOperations::handleDeleteRequest - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la suppression de l'utilisateur: " . $e->getMessage(), 500);
        }
    }
    
    private function deleteUserTables($identifiantTechnique) {
        // Liste des tables à supprimer pour chaque utilisateur
        $tables = [
            "documents_{$identifiantTechnique}",
            "document_groupes_{$identifiantTechnique}",
            "exigences_{$identifiantTechnique}",
            "collaborateurs_{$identifiantTechnique}",
            "bibliotheque_{$identifiantTechnique}",
            "collaboration_{$identifiantTechnique}",
            "collaboration_groups_{$identifiantTechnique}"
            // Ajoutez d'autres tables selon votre schéma
        ];
        
        $tablesDropped = [];
        $errors = [];
        
        foreach ($tables as $table) {
            try {
                error_log("Tentative de suppression de la table {$table}");
                $query = "DROP TABLE IF EXISTS {$table}";
                $this->conn->exec($query);
                $tablesDropped[] = $table;
                error_log("Table {$table} supprimée avec succès");
            } catch (PDOException $e) {
                error_log("Erreur lors de la suppression de la table {$table}: " . $e->getMessage());
                $errors[] = [
                    'table' => $table,
                    'error' => $e->getMessage()
                ];
                // On continue malgré l'erreur
            }
        }
        
        error_log("Tables supprimées: " . implode(", ", $tablesDropped));
        if (count($errors) > 0) {
            error_log("Erreurs lors de la suppression des tables: " . json_encode($errors));
        }
        
        return [
            'success' => true,
            'tables_dropped' => $tablesDropped,
            'errors' => $errors
        ];
    }
}
?>
