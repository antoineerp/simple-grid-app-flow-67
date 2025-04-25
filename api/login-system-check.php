
<?php
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic du Système de Connexion</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1, h2 { color: #333; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { color: blue; }
        .code { background: #f5f5f5; padding: 10px; border-left: 4px solid #ddd; overflow: auto; }
        section { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Diagnostic du Système de Connexion FormaCert</h1>
    
    <section id="php-check">
        <h2>1. Vérification de l'exécution PHP</h2>
        <?php if (phpversion()): ?>
            <p class="success">PHP fonctionne correctement! Version: <?php echo phpversion(); ?></p>
        <?php else: ?>
            <p class="error">PHP ne semble pas fonctionner correctement.</p>
        <?php endif; ?>
    </section>
    
    <section id="database-check">
        <h2>2. Vérification de la base de données</h2>
        <?php
        // Inclusion du fichier de configuration de la base de données
        if (file_exists(__DIR__ . '/config/database.php')) {
            include_once __DIR__ . '/config/database.php';
            echo "<p class='success'>Le fichier de configuration de la base de données existe.</p>";
            
            try {
                $database = new Database();
                $db_connection = $database->getConnection(false);
                if ($database->is_connected) {
                    echo "<p class='success'>Connexion à la base de données réussie!</p>";
                    echo "<p>Configuration actuelle: " . $database->host . " / " . $database->db_name . " / " . $database->username . "</p>";
                } else {
                    echo "<p class='error'>Impossible de se connecter à la base de données: " . $database->connection_error . "</p>";
                }
            } catch (Exception $e) {
                echo "<p class='error'>Erreur lors de la connexion à la base de données: " . $e->getMessage() . "</p>";
            }
        } else {
            echo "<p class='error'>Le fichier de configuration de la base de données n'existe pas: " . __DIR__ . '/config/database.php' . "</p>";
        }
        ?>
    </section>
    
    <section id="auth-check">
        <h2>3. Vérification des contrôleurs d'authentification</h2>
        <?php
        $authController = __DIR__ . '/controllers/AuthController.php';
        if (file_exists($authController)) {
            echo "<p class='success'>Le contrôleur d'authentification existe.</p>";
        } else {
            echo "<p class='error'>Le contrôleur d'authentification n'existe pas: $authController</p>";
        }
        ?>
    </section>
    
    <section id="user-check">
        <h2>4. Vérification de la table des utilisateurs</h2>
        <?php
        if (isset($database) && $database->is_connected) {
            try {
                $query = "SHOW TABLES LIKE 'utilisateurs'";
                $stmt = $db_connection->prepare($query);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    echo "<p class='success'>La table 'utilisateurs' existe.</p>";
                    
                    // Vérifier le contenu de la table
                    $query = "SELECT COUNT(*) as count FROM utilisateurs";
                    $stmt = $db_connection->prepare($query);
                    $stmt->execute();
                    $result = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    echo "<p>Nombre d'utilisateurs: " . $result['count'] . "</p>";
                    
                    // Afficher quelques utilisateurs
                    $query = "SELECT id, nom, prenom, email, role, identifiant_technique FROM utilisateurs LIMIT 5";
                    $stmt = $db_connection->prepare($query);
                    $stmt->execute();
                    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    if (count($users) > 0) {
                        echo "<p>Exemples d'utilisateurs:</p>";
                        echo "<ul>";
                        foreach ($users as $user) {
                            echo "<li>" . $user['email'] . " - " . $user['identifiant_technique'] . " (" . $user['role'] . ")</li>";
                        }
                        echo "</ul>";
                    }
                } else {
                    echo "<p class='error'>La table 'utilisateurs' n'existe pas.</p>";
                }
            } catch (PDOException $e) {
                echo "<p class='error'>Erreur lors de la vérification de la table utilisateurs: " . $e->getMessage() . "</p>";
            }
        }
        ?>
    </section>
    
    <section id="http-headers">
        <h2>5. En-têtes HTTP</h2>
        <div class="code">
            <pre><?php print_r(getallheaders()); ?></pre>
        </div>
    </section>
    
    <section id="server-info">
        <h2>6. Variables serveur</h2>
        <div class="code">
            <?php
            echo "SERVER_SOFTWARE: " . $_SERVER['SERVER_SOFTWARE'] . "<br>";
            echo "DOCUMENT_ROOT: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
            echo "SCRIPT_FILENAME: " . $_SERVER['SCRIPT_FILENAME'] . "<br>";
            echo "REQUEST_URI: " . $_SERVER['REQUEST_URI'] . "<br>";
            echo "PHP_SELF: " . $_SERVER['PHP_SELF'] . "<br>";
            echo "Heure serveur: " . date('Y-m-d H:i:s') . "<br>";
            ?>
        </div>
    </section>
    
    <section id="test-login">
        <h2>7. Test de connexion</h2>
        <p class="info">Utilisateurs de test disponibles:</p>
        <ul>
            <li>admin / admin123</li>
            <li>p71x6d_system / Trottinette43!</li>
            <li>antcirier@gmail.com / password123</li>
            <li>p71x6d_dupont / manager456</li>
            <li>p71x6d_martin / user789</li>
        </ul>
        
        <p>Vous pouvez tester la connexion en accédant à: <a href="https://qualiopi.ch/api/login-test.php" target="_blank">https://qualiopi.ch/api/login-test.php</a></p>
        
        <p>Exemple de requête:</p>
        <div class="code">curl -X POST https://qualiopi.ch/api/login-test.php -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'</div>
    </section>
</body>
</html>
