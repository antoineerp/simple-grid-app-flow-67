
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour désactiver un workflow
function disableWorkflow($path) {
    if (file_exists($path)) {
        $newPath = $path . '.disabled';
        if (rename($path, $newPath)) {
            return true;
        }
    }
    return false;
}

// Traitement du formulaire
$message = '';
$error = '';
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['disable_workflows'])) {
    $workflows = [
        '.github/workflows/deploy.yml',
        '.github/workflows/deploy-simple.yml',
        '.github/workflows/deploy-optimized.yml'
    ];
    
    $disabledCount = 0;
    foreach ($workflows as $workflow) {
        if (disableWorkflow($workflow)) {
            $disabledCount++;
        }
    }
    
    if ($disabledCount > 0) {
        $success = true;
        $message = "$disabledCount workflow(s) ont été désactivés avec succès.";
    } else {
        $error = "Aucun workflow n'a pu être désactivé. Ils sont peut-être déjà désactivés ou introuvables.";
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Désactivation des anciens workflows</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; padding: 10px; background-color: #d4edda; border-radius: 5px; }
        .error { color: red; padding: 10px; background-color: #f8d7da; border-radius: 5px; }
        .button { 
            background-color: #dc3545; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 16px;
            text-decoration: none;
            display: inline-block;
        }
        .button.green { background-color: #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Désactivation des anciens workflows GitHub</h1>
        
        <div class="card">
            <h2>Désactiver les workflows obsolètes</h2>
            
            <?php if ($message): ?>
                <div class="success"><?php echo $message; ?></div>
            <?php endif; ?>
            
            <?php if ($error): ?>
                <div class="error"><?php echo $error; ?></div>
            <?php endif; ?>
            
            <p>Cette action va désactiver tous les anciens workflows de déploiement (deploy.yml, deploy-simple.yml, deploy-optimized.yml) en les renommant avec une extension .disabled</p>
            <p>Seul le workflow unifié (deploy-unified.yml) restera actif.</p>
            
            <?php if (!$success): ?>
            <form method="post">
                <p><button type="submit" name="disable_workflows" class="button">Désactiver les anciens workflows</button></p>
            </form>
            <?php else: ?>
                <p><a href="check-workflows.php" class="button green">Vérifier l'état des workflows</a></p>
            <?php endif; ?>
            
            <p><a href="deploy-on-infomaniak.php">Retour à la page de déploiement</a></p>
        </div>
    </div>
</body>
</html>
