
<?php
header('Content-Type: text/html; charset=utf-8');

// Récupère les paramètres
$externalUrl = $_POST['external_url'] ?? '';
$localPath = $_POST['local_path'] ?? '';

if (empty($externalUrl) || empty($localPath)) {
    die("Paramètres manquants");
}

// Vérifie si index.html existe
$indexPath = './index.html';
if (!file_exists($indexPath)) {
    die("Le fichier index.html est introuvable");
}

// Crée une sauvegarde
$backupPath = $indexPath . '.bak-' . date('YmdHis');
if (!copy($indexPath, $backupPath)) {
    die("Impossible de créer une sauvegarde du fichier index.html");
}

// Charge le contenu du fichier
$content = file_get_contents($indexPath);
if ($content === false) {
    die("Impossible de lire le contenu du fichier index.html");
}

// Remplace la référence externe par la référence locale avec un commentaire pour le fallback
$pattern = '/<script[^>]*src=["\']' . preg_quote($externalUrl, '/') . '["\'](.*?)><\/script>/i';
$replacement = '<script src="' . $localPath . '"$1></script><!-- Fallback local pour ' . $externalUrl . ' -->';

$newContent = preg_replace($pattern, $replacement, $content);

// Vérifie si une modification a été effectuée
if ($newContent == $content) {
    // Si aucune correspondance exacte n'a été trouvée, essayons une approche plus générique
    // pour détecter tout script qui contient le domaine (par exemple cdn.gpteng.co)
    $domain = parse_url($externalUrl, PHP_URL_HOST);
    $pattern = '/<script[^>]*src=["\'][^"\']*' . preg_quote($domain, '/') . '[^"\']*["\'](.*?)><\/script>/i';
    $newContent = preg_replace($pattern, $replacement, $content);
    
    // Si toujours pas de modification, ajoutons simplement le script de fallback après le script original
    if ($newContent == $content) {
        $pattern = '/<script[^>]*src=["\'][^"\']*' . preg_quote($domain, '/') . '[^"\']*["\'](.*?)><\/script>/i';
        $replacement = '$0' . PHP_EOL . '  <script src="' . $localPath . '"$1></script><!-- Fallback local pour ' . $externalUrl . ' -->';
        $newContent = preg_replace($pattern, $replacement, $content);
    }
}

// Vérifie si une modification a été effectuée
if ($newContent == $content) {
    echo "<h1>Aucune modification nécessaire</h1>";
    echo "<p>Aucune correspondance trouvée pour l'URL $externalUrl dans index.html.</p>";
} else {
    // Enregistre les modifications
    if (file_put_contents($indexPath, $newContent)) {
        echo "<h1>Mise à jour réussie</h1>";
        echo "<p>Le fichier index.html a été mis à jour pour utiliser la version locale du script.</p>";
        echo "<ul>";
        echo "<li>URL externe: " . htmlspecialchars($externalUrl) . "</li>";
        echo "<li>Chemin local: " . htmlspecialchars($localPath) . "</li>";
        echo "<li>Une sauvegarde a été créée: " . basename($backupPath) . "</li>";
        echo "</ul>";
    } else {
        echo "<h1>Erreur lors de la mise à jour</h1>";
        echo "<p>Impossible d'écrire dans le fichier index.html.</p>";
    }
}
?>
<p><a href="test-assets-routes.php">Retour aux tests des routes</a></p>
