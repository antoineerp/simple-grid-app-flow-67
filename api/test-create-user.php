
<?php
// Script de diagnostic pour tester la création d'utilisateur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Configuration de la base de données
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

try {
    // Connexion à la base de données
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    echo "<h1>Diagnostic de création d'utilisateur</h1>";
    echo "<h2>Étape 1: Test de connexion à la base de données</h2>";
    
    $pdo = new PDO($dsn, $username, $password, $options);
    echo "<p style='color: green'>✓ Connexion à la base de données réussie</p>";
    
    // Vérifier la table utilisateurs
    echo "<h2>Étape 2: Vérification de la table utilisateurs</h2>";
    
    $tableExistsQuery = "SHOW TABLES LIKE 'utilisateurs'";
    $stmt = $pdo->prepare($tableExistsQuery);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        echo "<p style='color: green'>✓ Table 'utilisateurs' trouvée</p>";
        
        // Vérifier la structure de la table
        echo "<h3>Structure de la table</h3>";
        echo "<pre>";
        
        $describeQuery = "DESCRIBE utilisateurs";
        $stmt = $pdo->prepare($describeQuery);
        $stmt->execute();
        $columns = $stmt->fetchAll();
        
        echo "<table border='1' cellpadding='5'>";
        echo "<tr><th>Champ</th><th>Type</th><th>Null</th><th>Clé</th><th>Défaut</th><th>Extra</th></tr>";
        
        foreach ($columns as $column) {
            echo "<tr>";
            echo "<td>" . $column['Field'] . "</td>";
            echo "<td>" . $column['Type'] . "</td>";
            echo "<td>" . $column['Null'] . "</td>";
            echo "<td>" . $column['Key'] . "</td>";
            echo "<td>" . $column['Default'] . "</td>";
            echo "<td>" . $column['Extra'] . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        
        // Vérifier les valeurs autorisées pour le champ 'role'
        if(stripos($columns[5]['Type'], 'enum') !== false) {
            echo "<h3>Valeurs ENUM autorisées pour 'role':</h3>";
            echo "<p>" . $columns[5]['Type'] . "</p>";
        }
        
        // Compter les utilisateurs
        $countQuery = "SELECT COUNT(*) FROM utilisateurs";
        $stmt = $pdo->prepare($countQuery);
        $stmt->execute();
        $count = $stmt->fetchColumn();
        
        echo "<h3>Nombre d'utilisateurs: " . $count . "</h3>";
        
        if ($count > 0) {
            // Afficher les utilisateurs existants
            $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs";
            $stmt = $pdo->prepare($query);
            $stmt->execute();
            $users = $stmt->fetchAll();
            
            echo "<h3>Utilisateurs existants:</h3>";
            echo "<table border='1' cellpadding='5'>";
            echo "<tr><th>ID</th><th>Nom</th><th>Prénom</th><th>Email</th><th>Identifiant Technique</th><th>Rôle</th><th>Date Création</th></tr>";
            
            foreach ($users as $user) {
                echo "<tr>";
                echo "<td>" . $user['id'] . "</td>";
                echo "<td>" . $user['nom'] . "</td>";
                echo "<td>" . $user['prenom'] . "</td>";
                echo "<td>" . $user['email'] . "</td>";
                echo "<td>" . $user['identifiant_technique'] . "</td>";
                echo "<td>" . $user['role'] . "</td>";
                echo "<td>" . $user['date_creation'] . "</td>";
                echo "</tr>";
            }
            
            echo "</table>";
        }
    } else {
        echo "<p style='color: red'>✗ Table 'utilisateurs' non trouvée</p>";
        
        // Créer la table si elle n'existe pas
        echo "<h3>Création de la table 'utilisateurs'...</h3>";
        
        $createTableQuery = "CREATE TABLE IF NOT EXISTS utilisateurs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            prenom VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            mot_de_passe VARCHAR(255) NOT NULL,
            identifiant_technique VARCHAR(100) NOT NULL UNIQUE,
            role ENUM('admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire') NOT NULL,
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createTableQuery);
        echo "<p style='color: green'>✓ Table 'utilisateurs' créée avec succès</p>";
    }
    
    // Tester la création d'un utilisateur
    echo "<h2>Étape 3: Test de création d'un utilisateur</h2>";
    
    // Générer des données uniques
    $testEmail = "test_" . time() . "@example.com";
    $testIdentifiant = "p71x6d_test_" . time();
    
    echo "<h3>Tentative d'insertion d'un utilisateur test</h3>";
    echo "<p>Email: " . $testEmail . "<br>Identifiant: " . $testIdentifiant . "</p>";
    
    // Hasher le mot de passe
    $password = password_hash("Test123!", PASSWORD_BCRYPT);
    
    try {
        // Insérer l'utilisateur test
        $query = "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                  VALUES ('Test', 'Utilisateur', :email, :mot_de_passe, :identifiant_technique, 'utilisateur')";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(":email", $testEmail);
        $stmt->bindParam(":mot_de_passe", $password);
        $stmt->bindParam(":identifiant_technique", $testIdentifiant);
        
        $result = $stmt->execute();
        
        if ($result) {
            $id = $pdo->lastInsertId();
            
            if ($id) {
                echo "<p style='color: green'>✓ Utilisateur test créé avec succès! ID: " . $id . "</p>";
                
                // Vérifier que l'utilisateur a bien été inséré
                $query = "SELECT * FROM utilisateurs WHERE id = :id";
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(":id", $id);
                $stmt->execute();
                
                if ($user = $stmt->fetch()) {
                    echo "<h3>Utilisateur inséré:</h3>";
                    echo "<pre>";
                    print_r($user);
                    echo "</pre>";
                } else {
                    echo "<p style='color: red'>✗ Utilisateur introuvable après insertion!</p>";
                }
                
                // Supprimer l'utilisateur test
                echo "<h3>Suppression de l'utilisateur test...</h3>";
                
                $query = "DELETE FROM utilisateurs WHERE id = :id";
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(":id", $id);
                $stmt->execute();
                
                echo "<p style='color: green'>✓ Utilisateur test supprimé</p>";
            } else {
                echo "<p style='color: red'>✗ Erreur: Aucun ID retourné après insertion</p>";
            }
        } else {
            echo "<p style='color: red'>✗ Échec de l'insertion</p>";
            echo "<pre>";
            print_r($stmt->errorInfo());
            echo "</pre>";
        }
    } catch (PDOException $e) {
        echo "<p style='color: red'>✗ Erreur PDO lors de l'insertion: " . $e->getMessage() . "</p>";
        echo "<p>Code: " . $e->getCode() . "</p>";
        
        if ($stmt) {
            echo "<p>Détails de l'erreur:</p>";
            echo "<pre>";
            print_r($stmt->errorInfo());
            echo "</pre>";
        }
    }
    
    // Afficher les permissions de l'utilisateur MySQL
    echo "<h2>Étape 4: Vérification des permissions MySQL</h2>";
    
    try {
        $query = "SHOW GRANTS FOR CURRENT_USER()";
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $grants = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo "<h3>Permissions de l'utilisateur MySQL:</h3>";
        echo "<ul>";
        
        foreach ($grants as $grant) {
            echo "<li>" . htmlspecialchars($grant) . "</li>";
        }
        
        echo "</ul>";
    } catch (PDOException $e) {
        echo "<p style='color: red'>✗ Impossible de vérifier les permissions: " . $e->getMessage() . "</p>";
    }
    
    echo "<h2>Diagnostic terminé</h2>";
    
} catch (PDOException $e) {
    echo "<h1 style='color: red'>Erreur PDO: " . $e->getMessage() . "</h1>";
    echo "<p>Code: " . $e->getCode() . "</p>";
} catch (Exception $e) {
    echo "<h1 style='color: red'>Erreur: " . $e->getMessage() . "</h1>";
}
?>
