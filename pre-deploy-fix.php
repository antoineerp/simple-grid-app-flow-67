
<?php
// Script à exécuter avant le déploiement pour résoudre les problèmes courants
header('Content-Type: text/html; charset=utf-8');

// Fonction pour créer un répertoire s'il n'existe pas
function ensure_directory_exists($path) {
    if (!file_exists($path)) {
        return mkdir($path, 0755, true);
    }
    return true;
}

// Répertoires à créer
$directories = [
    './api',
    './api/documentation',
    './api/config',
    './api/controllers',
    './api/models',
    './api/middleware',
    './api/operations',
    './api/utils',
    './assets',
    './public/lovable-uploads'
];

$results = [];
foreach ($directories as $dir) {
    $results[$dir] = ensure_directory_exists($dir);
}

// Créer un README dans api/documentation pour éviter l'erreur FTP
$readme_path = './api/documentation/README.md';
if (!file_exists($readme_path)) {
    file_put_contents($readme_path, "# Documentation API\n\nCe dossier contient la documentation de l'API.");
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Préparation au déploiement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; }
        .error { color: red; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Préparation au déploiement</h1>
    <p>Création des répertoires nécessaires pour éviter les erreurs de déploiement.</p>
    
    <h2>Résultats</h2>
    <table>
        <tr>
            <th>Répertoire</th>
            <th>Statut</th>
        </tr>
        <?php foreach ($results as $dir => $success): ?>
        <tr>
            <td><?php echo htmlspecialchars($dir); ?></td>
            <td class="<?php echo $success ? 'success' : 'error'; ?>">
                <?php echo $success ? 'Créé/Existant' : 'Erreur'; ?>
            </td>
        </tr>
        <?php endforeach; ?>
    </table>
    
    <p>Le fichier README.md a été créé dans api/documentation.</p>
    
    <h2>Prochaine étape</h2>
    <p>Vous pouvez maintenant lancer le déploiement GitHub Actions. L'erreur 550 devrait être résolue.</p>
    
    <p><a href="javascript:history.back()">Retour</a></p>
</body>
</html>
