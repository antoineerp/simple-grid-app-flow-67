
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
            
            // Journaliser les informations de l'utilisateur avant suppression
            error_log("Suppression de l'utilisateur: ID=" . $user['id'] . 
                      ", Nom=" . $user['nom'] . 
                      ", Prenom=" . $user['prenom'] . 
                      ", Email=" . $user['email'] . 
                      ", IdTechnique=" . $user['identifiant_technique']);
            
            // Vérifier que l'identifiant technique est valide
            if (empty($user['identifiant_technique']) || strpos($user['identifiant_technique'], 'p71x6d_') !== 0) {
                error_log("Identifiant technique invalide ou manquant: " . $user['identifiant_technique']);
                ResponseHandler::error("Identifiant technique invalide pour la suppression des tables", 400);
                return;
            }
            
            // Supprimer les tables de l'utilisateur
            $tablesResult = $this->cleanupUserTables($user['identifiant_technique']);
            
            // Supprimer l'utilisateur
            $this->model->id = $data->id;
            if ($this->model->delete()) {
                ResponseHandler::success([
                    "message" => "Utilisateur supprimé avec succès",
                    "id" => $data->id,
                    "identifiant_technique" => $user['identifiant_technique'],
                    "cleanupStatus" => $tablesResult
                ]);
            } else {
                ResponseHandler::error("Impossible de supprimer l'utilisateur", 500);
            }
        } catch (Exception $e) {
            error_log("UserDeleteOperations::handleDeleteRequest - Erreur: " . $e->getMessage());
            ResponseHandler::error("Erreur lors de la suppression de l'utilisateur: " . $e->getMessage(), 500);
        }
    }
    
    /**
     * Nettoyage des tables associées à un utilisateur
     */
    private function cleanupUserTables($userId) {
        try {
            error_log("Nettoyage des tables pour l'utilisateur $userId");
            
            // Vérification du format de l'identifiant technique
            if (empty($userId) || strpos($userId, 'p71x6d_') !== 0) {
                error_log("Format d'identifiant invalide pour le nettoyage: $userId");
                return [
                    'success' => false,
                    'error' => 'Format d\'identifiant invalide',
                    'tablesDeleted' => 0
                ];
            }
            
            // Liste des préfixes de tables à nettoyer
            $tablePrefixes = [
                'documents_',
                'exigences_',
                'membres_',
                'bibliotheque_',
                'collaboration_',
                'collaboration_groups_',
                'test_'
            ];
            
            // Récupérer la liste des tables de la base de données
            $stmt = $this->conn->query("SHOW TABLES");
            $allTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $tablesToDelete = [];
            $deletedTables = [];
            $errors = [];
            
            // Identifier les tables spécifiques à l'utilisateur
            foreach ($allTables as $table) {
                foreach ($tablePrefixes as $prefix) {
                    $userSpecificPrefix = $prefix . $userId;
                    // Vérifier si la table appartient à l'utilisateur
                    if (strpos($table, $userSpecificPrefix) === 0) {
                        $tablesToDelete[] = $table;
                        break;
                    }
                }
            }
            
            error_log("Tables à supprimer pour l'utilisateur $userId: " . implode(", ", $tablesToDelete));
            
            // Supprimer les tables une par une
            foreach ($tablesToDelete as $table) {
                try {
                    $dropQuery = "DROP TABLE `{$table}`";
                    $this->conn->exec($dropQuery);
                    $deletedTables[] = $table;
                    error_log("Table supprimée: {$table}");
                } catch (PDOException $e) {
                    $errorMessage = "Erreur lors de la suppression de la table {$table}: " . $e->getMessage();
                    error_log($errorMessage);
                    $errors[] = $errorMessage;
                }
            }
            
            // Nettoyer aussi l'historique de synchronisation
            try {
                $this->conn->exec("DELETE FROM sync_history WHERE user_id = '{$userId}'");
                error_log("Historique de synchronisation nettoyé pour l'utilisateur $userId");
            } catch (PDOException $e) {
                error_log("Erreur lors du nettoyage de l'historique de synchronisation: " . $e->getMessage());
            }
            
            $result = [
                'success' => count($deletedTables) > 0 || count($tablesToDelete) === 0,
                'tablesFound' => count($tablesToDelete),
                'tablesDeleted' => count($deletedTables),
                'deletedTables' => $deletedTables
            ];
            
            if (!empty($errors)) {
                $result['errors'] = $errors;
            }
            
            error_log("Nettoyage terminé pour l'utilisateur $userId: " . json_encode($result));
            return $result;
            
        } catch (Exception $e) {
            error_log("Erreur lors du nettoyage des tables: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
?>
