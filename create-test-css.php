
<?php
// Ce script crée un fichier CSS de test dans le dossier assets

if (isset($_POST['create_css'])) {
    // Contenu du fichier CSS de test
    $css_content = "#test-css-element {
    color: blue;
    background-color: #e0f7fa;
    padding: 15px;
    border: 2px solid #4fc3f7;
    border-radius: 5px;
    font-weight: bold;
    text-align: center;
    margin-top: 10px;
}";

    // S'assurer que le dossier assets existe
    if (!is_dir('assets')) {
        mkdir('assets', 0755, true);
    }

    // Écrire le fichier CSS
    if (file_put_contents('assets/test-style.css', $css_content)) {
        echo json_encode(['success' => true, 'message' => 'Fichier CSS créé avec succès']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la création du fichier CSS']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Requête non valide']);
}
?>
