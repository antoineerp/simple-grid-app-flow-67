
<?php
require_once dirname(__FILE__) . '/BaseModel.php';
require_once dirname(__FILE__) . '/traits/TableManager.php';
require_once dirname(__FILE__) . '/traits/UserValidator.php';
require_once dirname(__FILE__) . '/traits/UserQueries.php';

class User extends BaseModel {
    use TableManager, UserValidator, UserQueries;

    // Properties
    public $id;
    public $nom;
    public $prenom;
    public $email;
    public $mot_de_passe;
    public $identifiant_technique;
    public $role;
    public $date_creation;

    public function __construct($db) {
        parent::__construct($db, 'utilisateurs');
    }

    public function countUsersByRole($role) {
        try {
            $query = "SELECT COUNT(*) FROM " . $this->table_name . " WHERE role = :role";
            $stmt = $this->conn->prepare($query);
            $role = $this->sanitizeInput($role);
            $stmt->bindParam(":role", $role);
            $stmt->execute();
            return $stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Erreur lors du comptage des utilisateurs par rôle: " . $e->getMessage());
            return 0;
        }
    }

    public function emailExists($email) {
        try {
            $query = "SELECT COUNT(*) FROM " . $this->table_name . " WHERE email = :email";
            $stmt = $this->conn->prepare($query);
            $email = $this->sanitizeInput($email);
            $stmt->bindParam(":email", $email);
            $stmt->execute();
            return ($stmt->fetchColumn() > 0);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'email: " . $e->getMessage());
            return false;
        }
    }

    public function identifiantExists($identifiant) {
        try {
            $query = "SELECT COUNT(*) FROM " . $this->table_name . " WHERE identifiant_technique = :identifiant";
            $stmt = $this->conn->prepare($query);
            $identifiant = $this->sanitizeInput($identifiant);
            $stmt->bindParam(":identifiant", $identifiant);
            $stmt->execute();
            return ($stmt->fetchColumn() > 0);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'identifiant: " . $e->getMessage());
            return false;
        }
    }

    public function findByEmailQuery($email) {
        try {
            $this->createTableIfNotExists();
            
            $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation 
                     FROM " . $this->table_name . " 
                     WHERE email = :email";
                     
            $stmt = $this->conn->prepare($query);
            $email = $this->sanitizeInput($email);
            $stmt->bindParam(":email", $email);
            $stmt->execute();
            
            return $stmt;
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche par email: " . $e->getMessage());
            return null;
        }
    }

    public function findByIdentifiant($identifiant) {
        $identifiant = $this->cleanUTF8($this->sanitizeInput($identifiant));
        $this->createTableIfNotExists();
        
        // Vérifier le format de l'identifiant
        if (empty($identifiant) || strpos($identifiant, 'p71x6d_') !== 0) {
            error_log("Identifiant technique invalide: {$identifiant}");
            return false;
        }
        
        $query = "SELECT * FROM " . $this->table_name . " WHERE identifiant_technique = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $identifiant);
        $stmt->execute();
        
        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            foreach ($row as $key => $value) {
                $this->$key = $value;
            }
            return true;
        }
        return false;
    }

    public function findByEmail($email) {
        $email = $this->cleanUTF8($this->sanitizeInput($email));
        $this->createTableIfNotExists();
        
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $email);
        $stmt->execute();
        
        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Vérifier et corriger l'identifiant technique si nécessaire
            if (empty($row['identifiant_technique']) || strpos($row['identifiant_technique'], 'p71x6d_') !== 0) {
                $identifiant_technique = 'p71x6d_' . preg_replace('/[^a-z0-9]/', '', strtolower($row['nom']));
                
                // Mettre à jour l'utilisateur dans la base de données
                $update = $this->conn->prepare("UPDATE " . $this->table_name . " SET identifiant_technique = ? WHERE id = ?");
                $update->execute([$identifiant_technique, $row['id']]);
                
                error_log("Identifiant technique corrigé pour l'utilisateur {$row['id']}: {$identifiant_technique}");
                
                $row['identifiant_technique'] = $identifiant_technique;
            }
            
            foreach ($row as $key => $value) {
                $this->$key = $value;
            }
            return true;
        }
        return false;
    }

    public function findById($id) {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Vérifier et corriger l'identifiant technique si nécessaire
            if ($user && (empty($user['identifiant_technique']) || strpos($user['identifiant_technique'], 'p71x6d_') !== 0)) {
                $identifiant_technique = 'p71x6d_' . preg_replace('/[^a-z0-9]/', '', strtolower($user['nom']));
                
                // Mettre à jour l'utilisateur dans la base de données
                $update = $this->conn->prepare("UPDATE " . $this->table_name . " SET identifiant_technique = ? WHERE id = ?");
                $update->execute([$identifiant_technique, $user['id']]);
                
                error_log("Identifiant technique corrigé pour l'utilisateur {$user['id']}: {$identifiant_technique}");
                
                $user['identifiant_technique'] = $identifiant_technique;
            }
            
            return $user;
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche par ID: " . $e->getMessage());
            return null;
        }
    }

    public function getAdminCount() {
        try {
            $query = "SELECT COUNT(*) FROM " . $this->table_name . " WHERE role IN ('admin', 'administrateur')";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt;
        } catch (PDOException $e) {
            error_log("Erreur lors du comptage des administrateurs: " . $e->getMessage());
            return null;
        }
    }

    public function getManager() {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE role = 'gestionnaire' LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $manager = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Vérifier et corriger l'identifiant technique si nécessaire
            if ($manager && (empty($manager['identifiant_technique']) || strpos($manager['identifiant_technique'], 'p71x6d_') !== 0)) {
                $identifiant_technique = 'p71x6d_' . preg_replace('/[^a-z0-9]/', '', strtolower($manager['nom']));
                
                // Mettre à jour l'utilisateur dans la base de données
                $update = $this->conn->prepare("UPDATE " . $this->table_name . " SET identifiant_technique = ? WHERE id = ?");
                $update->execute([$identifiant_technique, $manager['id']]);
                
                error_log("Identifiant technique corrigé pour le gestionnaire {$manager['id']}: {$identifiant_technique}");
                
                $manager['identifiant_technique'] = $identifiant_technique;
            }
            
            return $manager;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération du gestionnaire: " . $e->getMessage());
            return null;
        }
    }

    public function initializeUserDataFromManager($userId) {
        try {
            error_log("Initialisation des données pour l'utilisateur: $userId");
            
            // Vérifier le format de l'identifiant utilisateur
            if (empty($userId) || strpos($userId, 'p71x6d_') !== 0) {
                error_log("Format d'identifiant utilisateur invalide: $userId");
                return false;
            }
            
            $manager = $this->getManager();
            if (!$manager) {
                error_log("Aucun gestionnaire trouvé pour initialiser les données utilisateur");
                return false;
            }
            
            $managerIdentifiant = $manager['identifiant_technique'];
            error_log("Gestionnaire trouvé: $managerIdentifiant");
            
            // Créer ou mettre à jour les tables pour le nouvel utilisateur
            $this->createUserTables($userId);
            
            // Copier les données du gestionnaire vers le nouvel utilisateur
            $this->copyDataFromManagerToUser($managerIdentifiant, $userId);
            
            return true;
        } catch (Exception $e) {
            error_log("Erreur lors de l'initialisation des données utilisateur: " . $e->getMessage());
            return false;
        }
    }

    private function createUserTables($userId) {
        try {
            // Appel à db-update.php pour créer les tables utilisateur
            $apiUrl = '/api/db-update.php?userId=' . urlencode($userId);
            
            // Utiliser cURL pour l'appel interne
            $ch = curl_init('http://localhost' . $apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $response = curl_exec($ch);
            curl_close($ch);
            
            error_log("Résultat de la création des tables: " . $response);
            return true;
        } catch (Exception $e) {
            error_log("Erreur lors de la création des tables utilisateur: " . $e->getMessage());
            return false;
        }
    }

    private function copyDataFromManagerToUser($managerIdentifiant, $userId) {
        error_log("Copie des données de $managerIdentifiant vers $userId");
        
        try {
            // Tableaux à copier entre utilisateurs
            $tablesToCopy = ['bibliotheque', 'exigences', 'membres', 'documents', 'pilotage'];
            
            foreach ($tablesToCopy as $baseTableName) {
                // Noms des tables source et destination
                $sourceTable = "{$baseTableName}_{$managerIdentifiant}";
                $destTable = "{$baseTableName}_{$userId}";
                
                // Vérifier si la table source existe
                $checkSourceQuery = "SELECT COUNT(*) FROM information_schema.tables 
                                     WHERE table_schema = DATABASE() 
                                     AND table_name = :tableName";
                $stmt = $this->conn->prepare($checkSourceQuery);
                $stmt->bindParam(':tableName', $sourceTable);
                $stmt->execute();
                
                if ($stmt->fetchColumn() == 0) {
                    error_log("Table source {$sourceTable} n'existe pas, aucune copie effectuée");
                    continue;
                }
                
                // Vérifier si la table destination existe
                $stmt->bindParam(':tableName', $destTable);
                $stmt->execute();
                
                if ($stmt->fetchColumn() == 0) {
                    error_log("Table destination {$destTable} n'existe pas, création requise");
                    continue;
                }
                
                // Récupérer les données de la table source
                $selectQuery = "SELECT * FROM `{$sourceTable}`";
                $selectStmt = $this->conn->prepare($selectQuery);
                $selectStmt->execute();
                $rows = $selectStmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (count($rows) > 0) {
                    error_log("Copie de " . count($rows) . " enregistrements de {$sourceTable} vers {$destTable}");
                    
                    // Pour chaque enregistrement, insérer dans la table destination avec le nouvel userId
                    foreach ($rows as $row) {
                        // Remplacer l'userId par celui du nouvel utilisateur
                        $row['userId'] = $userId;
                        
                        // Générer la requête d'insertion
                        $columns = array_keys($row);
                        $placeholders = array_map(function($col) { return ":{$col}"; }, $columns);
                        
                        $insertQuery = "INSERT INTO `{$destTable}` (`" . implode("`, `", $columns) . "`) 
                                       VALUES (" . implode(", ", $placeholders) . ")
                                       ON DUPLICATE KEY UPDATE ";
                        
                        // Génération de la partie UPDATE de la requête
                        $updates = [];
                        foreach ($columns as $col) {
                            if ($col != 'id') { // Ne pas mettre à jour la clé primaire
                                $updates[] = "`{$col}` = :{$col}";
                            }
                        }
                        $insertQuery .= implode(", ", $updates);
                        
                        // Exécuter la requête
                        $insertStmt = $this->conn->prepare($insertQuery);
                        foreach ($row as $col => $val) {
                            $insertStmt->bindValue(":{$col}", $val);
                        }
                        $insertStmt->execute();
                    }
                    
                    error_log("Copie des données de {$sourceTable} vers {$destTable} terminée");
                } else {
                    error_log("Aucune donnée à copier depuis {$sourceTable}");
                }
            }
            
            return true;
        } catch (PDOException $e) {
            error_log("Erreur PDO lors de la copie des données: " . $e->getMessage());
            return false;
        } catch (Exception $e) {
            error_log("Erreur lors de la copie des données: " . $e->getMessage());
            return false;
        }
    }
}
