
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
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Traitement de la requête POST
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Récupérer les données envoyées
        $input = file_get_contents('php://input');
        $data = json_decode($input);
        
        if ($data) {
            // Générer un identifiant technique unique si non fourni
            if (!isset($data->identifiant_technique) || empty($data->identifiant_technique)) {
                $timestamp = time();
                $randomStr = substr(md5(uniqid(mt_rand(), true)), 0, 8);
                $prenom = isset($data->prenom) ? preg_replace('/[^a-z0-9]/i', '', strtolower($data->prenom)) : 'user';
                $nom = isset($data->nom) ? preg_replace('/[^a-z0-9]/i', '', strtolower($data->nom)) : 'test';
                $data->identifiant_technique = "p71x6d_{$prenom}_{$nom}_{$randomStr}_{$timestamp}";
            }
            
            // Hashage du mot de passe si fourni
            if (isset($data->mot_de_passe) && !empty($data->mot_de_passe)) {
                $data->mot_de_passe = password_hash($data->mot_de_passe, PASSWORD_BCRYPT);
            } else {
                $data->mot_de_passe = password_hash('Test123!', PASSWORD_BCRYPT); // Mot de passe par défaut
            }
            
            // Définir un rôle par défaut si non fourni
            if (!isset($data->role) || empty($data->role)) {
                $data->role = 'utilisateur';
            }
            
            // Validation de base
            $errors = [];
            if (!isset($data->nom) || empty($data->nom)) $errors[] = "Le nom est requis";
            if (!isset($data->prenom) || empty($data->prenom)) $errors[] = "Le prénom est requis";
            if (!isset($data->email) || empty($data->email)) $errors[] = "L'email est requis";
            
            if (count($errors) > 0) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Validation échouée',
                    'errors' => $errors
                ]);
                exit;
            }
            
            // Vérifier si l'email existe déjà
            $stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE email = :email");
            $stmt->execute(['email' => $data->email]);
            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'status' => 'error',
                    'message' => "L'email existe déjà dans la base de données"
                ]);
                exit;
            }
            
            // Vérifier le nombre d'utilisateurs gestionnaires si un nouveau gestionnaire est créé
            if ($data->role === 'gestionnaire') {
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM utilisateurs WHERE role = 'gestionnaire'");
                $stmt->execute();
                $count = $stmt->fetchColumn();
                if ($count > 0) {
                    echo json_encode([
                        'status' => 'error',
                        'message' => "Un seul compte gestionnaire est autorisé dans le système"
                    ]);
                    exit;
                }
            }
            
            // Tentative d'insertion
            $query = "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                      VALUES (:nom, :prenom, :email, :mot_de_passe, :identifiant_technique, :role)";
            $stmt = $pdo->prepare($query);
            
            $params = [
                'nom' => $data->nom,
                'prenom' => $data->prenom,
                'email' => $data->email,
                'mot_de_passe' => $data->mot_de_passe,
                'identifiant_technique' => $data->identifiant_technique,
                'role' => $data->role
            ];
            
            $success = $stmt->execute($params);
            $newId = $pdo->lastInsertId();
            
            if ($success && $newId) {
                // Récupérer l'utilisateur créé pour confirmation
                $stmt = $pdo->prepare("SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs WHERE id = :id");
                $stmt->execute(['id' => $newId]);
                $user = $stmt->fetch();
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Utilisateur créé avec succès',
                    'user' => $user
                ]);
            } else {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Échec de la création de l\'utilisateur',
                    'details' => $stmt->errorInfo()
                ]);
            }
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Données JSON invalides ou manquantes'
            ]);
        }
    } else {
        // Réponse pour les requêtes GET - Interface HTML simple
        echo "<h1>Diagnostic de création d'utilisateur</h1>";
        
        // Afficher le formulaire
        echo "<h2>Formulaire de test</h2>";
        echo "<form id='createUserForm'>";
        echo "<div style='margin-bottom: 10px;'><label>Prénom: <input type='text' name='prenom' value='Test' /></label></div>";
        echo "<div style='margin-bottom: 10px;'><label>Nom: <input type='text' name='nom' value='Utilisateur' /></label></div>";
        echo "<div style='margin-bottom: 10px;'><label>Email: <input type='email' name='email' value='test" . time() . "@example.com' /></label></div>";
        echo "<div style='margin-bottom: 10px;'><label>Mot de passe: <input type='password' name='mot_de_passe' value='Test123!' /></label></div>";
        echo "<div style='margin-bottom: 10px;'><label>Rôle: <select name='role'>";
        echo "<option value='utilisateur'>Utilisateur</option>";
        echo "<option value='gestionnaire'>Gestionnaire</option>";
        echo "<option value='administrateur'>Administrateur</option>";
        echo "</select></label></div>";
        echo "<button type='submit'>Créer l'utilisateur</button>";
        echo "</form>";
        
        echo "<div id='result' style='margin-top: 20px; padding: 10px; border: 1px solid #ccc;'></div>";
        
        echo "<h2>Utilisateurs existants</h2>";
        echo "<div id='users'>";
        
        // Afficher les utilisateurs existants
        try {
            $stmt = $pdo->query("SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs");
            $users = $stmt->fetchAll();
            
            if (count($users) > 0) {
                echo "<table border='1' cellpadding='5'>";
                echo "<tr><th>ID</th><th>Nom</th><th>Prénom</th><th>Email</th><th>Identifiant</th><th>Rôle</th><th>Date de création</th></tr>";
                
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
            } else {
                echo "<p>Aucun utilisateur trouvé dans la base de données.</p>";
            }
        } catch (PDOException $e) {
            echo "<p style='color: red;'>Erreur lors de la récupération des utilisateurs: " . $e->getMessage() . "</p>";
        }
        
        echo "</div>";
        
        // JavaScript pour le formulaire
        echo "<script>
            document.getElementById('createUserForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const data = {};
                
                for (let [key, value] of formData.entries()) {
                    data[key] = value;
                }
                
                fetch(window.location.href, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })
                .then(response => response.json())
                .then(result => {
                    document.getElementById('result').innerHTML = 
                        '<h3>' + (result.status === 'success' ? 'Succès' : 'Erreur') + '</h3>' +
                        '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
                        
                    if (result.status === 'success') {
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    }
                })
                .catch(error => {
                    document.getElementById('result').innerHTML = 
                        '<h3>Erreur</h3><pre>' + error + '</pre>';
                });
            });
        </script>";
    }
} catch (PDOException $e) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        echo json_encode([
            'status' => 'error',
            'message' => 'Erreur de base de données: ' . $e->getMessage(),
            'code' => $e->getCode()
        ]);
    } else {
        echo "<h1 style='color: red;'>Erreur de connexion à la base de données</h1>";
        echo "<p>" . $e->getMessage() . "</p>";
        echo "<p>Code d'erreur: " . $e->getCode() . "</p>";
    }
} catch (Exception $e) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        echo json_encode([
            'status' => 'error',
            'message' => 'Erreur: ' . $e->getMessage()
        ]);
    } else {
        echo "<h1 style='color: red;'>Erreur</h1>";
        echo "<p>" . $e->getMessage() . "</p>";
    }
}
?>
