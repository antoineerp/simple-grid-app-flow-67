
<?php
header('Content-Type: application/json; charset=utf-8');

if (isset($_POST['create_css'])) {
    // Créer le dossier assets s'il n'existe pas
    if (!is_dir('assets')) {
        mkdir('assets', 0755, true);
    }
    
    // Contenu du CSS de test
    $cssContent = <<<CSS
/* Fichier CSS de test pour vérifier les types MIME */
#test-css-element {
    background-color: #e3f2fd;
    border: 2px solid #2196f3;
    padding: 15px;
    margin: 20px 0;
    font-weight: bold;
    color: #0d47a1;
    text-align: center;
}
CSS;
    
    // Écrire le fichier
    if (file_put_contents('assets/test-style.css', $cssContent) !== false) {
        echo json_encode(['success' => true, 'message' => 'Fichier CSS de test créé avec succès']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Impossible de créer le fichier CSS de test']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Requête invalide']);
}
?>
