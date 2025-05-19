
<?php
// Assurons-nous que rien ne sera affiché avant les en-têtes
ob_start();

// Début de la journalisation
error_log("=== DÉBUT DE L'EXÉCUTION DE AuthController.php ===");

// Configuration des en-têtes CORS et de la réponse JSON
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Preflight OK']);
    exit;
}

try {
    // Vérifier si la méthode est POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        error_log("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. Utilisez POST pour l\'authentification.']);
        exit;
    }

    // Récupérer les données POST
    $json_input = file_get_contents("php://input");

    // Journaliser la réception des données (masquer les infos sensibles)
    $log_input = json_decode($json_input, true);
    if (isset($log_input['password'])) {
        $log_input['password'] = '********';
    }
    error_log("Données reçues: " . json_encode($log_input ?? $json_input));

    // Vérifier si les données sont vides
    if (empty($json_input)) {
        throw new Exception("Aucune donnée reçue");
    }
    
    $data = json_decode($json_input);

    // Vérifier si le décodage a réussi
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
    }

    // Vérifier si les données sont présentes
    if(!empty($data->username) && !empty($data->password)) {
        $username = $data->username;
        $password = $data->password;
        
        error_log("Tentative de connexion pour: " . $username);
        
        // Connexion spéciale pour antcirier@gmail.com
        if ($username === 'antcirier@gmail.com' && 
            ($password === 'password123' || $password === 'Password123!' || $password === 'Trottinette43!')) {
            
            error_log("Connexion spéciale acceptée pour antcirier@gmail.com");
            
            // Identifiant technique standardisé
            $identifiant_technique = 'p71x6d_cirier';
            
            // Générer un token simple
            $token = base64_encode(json_encode([
                'user' => [
                    'id' => '999',
                    'username' => $username,
                    'identifiant_technique' => $identifiant_technique,
                    'email' => $username,
                    'role' => 'admin',
                    'nom' => 'Cirier',
                    'prenom' => 'Antoine'
                ],
                'exp' => time() + 3600
            ]));
            
            // Envoyer la réponse
            echo json_encode([
                'success' => true,
                'message' => 'Connexion réussie',
                'token' => $token,
                'user' => [
                    'id' => '999',
                    'nom' => 'Cirier',
                    'prenom' => 'Antoine',
                    'email' => $username,
                    'identifiant_technique' => $identifiant_technique,
                    'role' => 'admin'
                ]
            ]);
            exit;
        }
        
        try {
            // Tentative de connexion à la base de données
            require_once __DIR__ . '/../config/database.php';
            $database = new Database();
            $db = $database->getConnection();
            
            if (!$db) {
                throw new Exception("Connexion à la base de données impossible");
            }
            
            // Recherche de l'utilisateur
            $query = "SELECT * FROM utilisateurs WHERE email = ? OR identifiant_technique = ? LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->execute([$username, $username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                $valid_password = password_verify($password, $user['mot_de_passe']);
                
                // Accepter aussi les mots de passe non hashés
                if (!$valid_password && $password === $user['mot_de_passe']) {
                    $valid_password = true;
                }
                
                if ($valid_password) {
                    // Vérifier et corriger l'identifiant technique si nécessaire
                    if (empty($user['identifiant_technique']) || strpos($user['identifiant_technique'], 'p71x6d_') !== 0) {
                        $identifiant_technique = 'p71x6d_' . preg_replace('/[^a-z0-9]/', '', strtolower($user['nom']));
                        
                        // Mettre à jour l'utilisateur dans la base de données
                        $update = $db->prepare("UPDATE utilisateurs SET identifiant_technique = ? WHERE id = ?");
                        $update->execute([$identifiant_technique, $user['id']]);
                        
                        error_log("Identifiant technique corrigé pour l'utilisateur {$user['id']}: {$identifiant_technique}");
                        
                        $user['identifiant_technique'] = $identifiant_technique;
                    }
                    
                    // Générer un token simple
                    $token = base64_encode(json_encode([
                        'user' => [
                            'id' => $user['id'],
                            'username' => $user['email'],
                            'identifiant_technique' => $user['identifiant_technique'],
                            'email' => $user['email'],
                            'role' => $user['role'],
                            'nom' => $user['nom'],
                            'prenom' => $user['prenom']
                        ],
                        'exp' => time() + 3600
                    ]));
                    
                    // Envoyer la réponse
                    echo json_encode([
                        'success' => true,
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
                    ]);
                    exit;
                } else {
                    throw new Exception("Mot de passe incorrect");
                }
            } else {
                // Si c'est antcirier@gmail.com, créer l'utilisateur automatiquement
                if ($username === 'antcirier@gmail.com') {
                    try {
                        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                        $identifiant_technique = 'p71x6d_cirier';
                        
                        $query = "INSERT INTO utilisateurs 
                            (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                            VALUES (?, ?, ?, ?, ?, ?)";
                        $stmt = $db->prepare($query);
                        $stmt->execute(['Cirier', 'Antoine', 'antcirier@gmail.com', $hashedPassword, $identifiant_technique, 'admin']);
                        
                        $userId = $db->lastInsertId();
                        
                        // Générer le token
                        $token = base64_encode(json_encode([
                            'user' => [
                                'id' => $userId,
                                'username' => 'antcirier@gmail.com',
                                'identifiant_technique' => $identifiant_technique,
                                'email' => 'antcirier@gmail.com',
                                'role' => 'admin',
                                'nom' => 'Cirier',
                                'prenom' => 'Antoine'
                            ],
                            'exp' => time() + 3600
                        ]));
                        
                        // Envoyer la réponse
                        echo json_encode([
                            'success' => true,
                            'message' => 'Compte créé et connexion réussie',
                            'token' => $token,
                            'user' => [
                                'id' => $userId,
                                'nom' => 'Cirier',
                                'prenom' => 'Antoine',
                                'email' => 'antcirier@gmail.com',
                                'identifiant_technique' => $identifiant_technique,
                                'role' => 'admin'
                            ]
                        ]);
                        exit;
                    } catch (PDOException $e) {
                        error_log("Erreur lors de la création de l'utilisateur: " . $e->getMessage());
                        throw new Exception("Erreur lors de la création de l'utilisateur");
                    }
                }
                
                throw new Exception("Utilisateur non trouvé");
            }
        } catch (Exception $e) {
            error_log("Erreur d'authentification: " . $e->getMessage());
            throw new Exception("Erreur d'authentification: " . $e->getMessage());
        }
    } else {
        throw new Exception("Nom d'utilisateur ou mot de passe manquant");
    }
} catch (Exception $e) {
    error_log("Erreur dans AuthController.php: " . $e->getMessage());
    
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE AuthController.php ===");
    ob_end_flush();
}
?>
