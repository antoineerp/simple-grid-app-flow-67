
<?php
header('Content-Type: text/html; charset=utf-8');

// Configuration
$workflow_dir = './.github/workflows';
$selective_workflow_file = "$workflow_dir/deploy-selective.yml";

// Vérification du dossier de workflow
if (!is_dir($workflow_dir)) {
    if (!mkdir($workflow_dir, 0755, true)) {
        die("Impossible de créer le dossier .github/workflows");
    }
}

// Récupérer le contenu du workflow sélectif depuis cette page
$current_file = __FILE__;
if (!file_exists($current_file)) {
    die("Impossible de trouver le fichier courant");
}

$content = file_get_contents($current_file);
if ($content === false) {
    die("Impossible de lire le contenu du fichier courant");
}

// Extraire le contenu du workflow entre les balises
$workflow_start = "name: Selective Deploy to Infomaniak";
$workflow_end = "        rm changed_files.txt";

$start_pos = strpos($content, $workflow_start);
$end_pos = strpos($content, $workflow_end);

if ($start_pos === false || $end_pos === false) {
    die("Impossible de trouver le contenu du workflow dans le fichier");
}

$workflow_content = substr($content, $start_pos, $end_pos - $start_pos + strlen($workflow_end));

// Écrire le fichier de workflow
if (file_put_contents($selective_workflow_file, $workflow_content)) {
    echo "<h1>Installation du workflow GitHub sélectif réussie</h1>";
    echo "<p>Le workflow a été installé dans <code>$selective_workflow_file</code></p>";
    echo "<p>Ce workflow ne déploiera que les fichiers nouveaux et modifiés sur votre serveur.</p>";
    
    // Vérifier les autres workflows existants
    $existing_workflows = glob("$workflow_dir/*.yml");
    if (count($existing_workflows) > 1) {
        echo "<h2>Autres workflows existants</h2>";
        echo "<p>Les workflows suivants existent également dans votre dossier .github/workflows :</p>";
        echo "<ul>";
        foreach ($existing_workflows as $workflow) {
            if ($workflow !== $selective_workflow_file) {
                echo "<li>" . basename($workflow) . "</li>";
            }
        }
        echo "</ul>";
        echo "<p><strong>Note:</strong> Vous pouvez désactiver ces workflows en les renommant avec une extension .disabled ou en les supprimant si vous préférez n'utiliser que le workflow sélectif.</p>";
    }
} else {
    echo "<h1>Erreur lors de l'installation du workflow GitHub</h1>";
    echo "<p>Impossible d'écrire le fichier de workflow dans <code>$selective_workflow_file</code></p>";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Installation du workflow GitHub sélectif</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; }
        code { background-color: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Comment utiliser le workflow sélectif</h2>
        <p>Le workflow sélectif que vous venez d'installer fonctionne comme suit :</p>
        <ol>
            <li>À chaque push sur la branche main, le workflow est déclenché</li>
            <li>Il compare le commit actuel avec le commit précédent pour déterminer les fichiers modifiés</li>
            <li>Seuls les fichiers nouveaux et modifiés sont transférés vers votre serveur</li>
            <li>Les fichiers compilés (assets, index.html) sont toujours transférés</li>
            <li>Les fichiers de configuration critiques sont également toujours mis à jour</li>
        </ol>
        
        <h2>Vérification manuelle</h2>
        <p>Pour vérifier que votre workflow est correctement configuré, allez sur GitHub :</p>
        <ol>
            <li>Accédez à votre dépôt</li>
            <li>Cliquez sur "Actions" dans la barre de navigation</li>
            <li>Vous devriez voir le workflow "Selective Deploy to Infomaniak" listé</li>
            <li>Vous pouvez le déclencher manuellement en cliquant sur "Run workflow"</li>
        </ol>
    </div>
</body>
</html>
