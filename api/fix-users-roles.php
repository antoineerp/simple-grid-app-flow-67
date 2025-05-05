
<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Mettre à jour les rôles admin vers administrateur
    $query = "UPDATE utilisateurs SET role = 'administrateur' WHERE role = 'admin'";
    $db->exec($query);

    // Mettre à jour les rôles user vers utilisateur
    $query = "UPDATE utilisateurs SET role = 'utilisateur' WHERE role = 'user'";
    $db->exec($query);

    // Modifier la structure de la colonne role
    $query = "ALTER TABLE utilisateurs MODIFY COLUMN role ENUM('administrateur', 'utilisateur', 'gestionnaire') NOT NULL";
    $db->exec($query);

    echo json_encode(['status' => 'success', 'message' => 'Rôles mis à jour avec succès']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
