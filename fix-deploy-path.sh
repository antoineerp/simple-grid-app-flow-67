
#!/bin/bash
# Script pour corriger les problèmes de chemin de déploiement Infomaniak

echo "=== Script de correction de chemin de déploiement ==="
echo "Date: $(date)"

# Vérifier le chemin actuel
CURRENT_DIR=$(pwd)
echo "Chemin actuel: $CURRENT_DIR"

# Chemin attendu pour Infomaniak
EXPECTED_PATH="/sites/qualiopi.ch"
if [ "$CURRENT_DIR" != "$EXPECTED_PATH" ]; then
    echo "Attention: Le chemin actuel ne correspond pas au chemin attendu d'Infomaniak"
    
    # Vérifier si le chemin attendu existe
    if [ -d "$EXPECTED_PATH" ]; then
        echo "Le répertoire $EXPECTED_PATH existe, déplacement vers ce répertoire"
        cd "$EXPECTED_PATH"
        echo "Nouveau chemin: $(pwd)"
    else
        echo "Le répertoire $EXPECTED_PATH n'existe pas, tentative de création"
        mkdir -p "$EXPECTED_PATH"
        if [ $? -eq 0 ]; then
            echo "Répertoire créé avec succès, déplacement vers ce répertoire"
            cd "$EXPECTED_PATH"
            echo "Nouveau chemin: $(pwd)"
        else
            echo "Impossible de créer le répertoire $EXPECTED_PATH"
            exit 1
        fi
    fi
else
    echo "Le chemin actuel est correct: $CURRENT_DIR"
fi

# Exécuter le script emergency-deploy-fix.php pour créer les fichiers nécessaires
echo "Exécution de emergency-deploy-fix.php..."
if command -v php &> /dev/null; then
    if [ -f "emergency-deploy-fix.php" ]; then
        php emergency-deploy-fix.php
    else
        # Créer le script s'il n'existe pas
        echo "Le script emergency-deploy-fix.php n'existe pas, création..."
        cat > emergency-deploy-fix.php << 'EOL'
<?php
header('Content-Type: text/plain');
echo "=== Script de réparation d'urgence pour le déploiement ===\n";
echo "Exécution: " . date('Y-m-d H:i:s') . "\n\n";

// Créer les dossiers nécessaires
$directories = [
    './api',
    './api/config',
    './api/utils',
    './api/data',
    './assets',
    './public'
];

echo "Création des dossiers nécessaires...\n";
foreach ($directories as $dir) {
    if (!file_exists($dir)) {
        if (mkdir($dir, 0755, true)) {
            echo "✅ Dossier $dir créé\n";
        } else {
            echo "❌ ERREUR: Impossible de créer le dossier $dir\n";
        }
    } else {
        echo "Le dossier $dir existe déjà\n";
    }
}

// Créer les fichiers minimum requis
$files = [
    'index.html' => '<!DOCTYPE html><html><head><title>FormaCert</title><link rel="stylesheet" href="/assets/main.css"></head><body><div id="root">Chargement...</div><script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script><script src="/assets/main.js"></script></body></html>',
    'assets/main.css' => '/* CSS principal */body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:0;}',
    'assets/main.js' => '// Script principal console.log("Application chargée");',
    'api/.htaccess' => 'RewriteEngine On\nHeader set Access-Control-Allow-Origin "*"\nHeader set Access-Control-Allow-Methods "GET, POST, OPTIONS, DELETE, PUT"\nHeader set Access-Control-Allow-Headers "Content-Type, Authorization, Accept, X-Requested-With"\nHeader set Access-Control-Max-Age "1728000"'
];

echo "\nCréation des fichiers nécessaires...\n";
foreach ($files as $file => $content) {
    $dir = dirname($file);
    if ($dir && $dir != '.' && !file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
    
    if (file_put_contents($file, $content)) {
        echo "✅ Fichier $file créé\n";
    } else {
        echo "❌ ERREUR: Impossible de créer $file\n";
    }
}

echo "\nScript terminé à " . date('Y-m-d H:i:s') . "\n";
?>
EOL
        chmod +x emergency-deploy-fix.php
        php emergency-deploy-fix.php
    fi
else
    echo "PHP n'est pas disponible dans ce shell, impossible d'exécuter le script"
    exit 1
fi

# Vérifier les fichiers essentiels
echo ""
echo "=== Vérification des fichiers essentiels ==="
ESSENTIAL_FILES=("assets/main.css" "index.html" "api/.htaccess" "assets/main.js")
ALL_OK=true

for FILE in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        echo "✅ $FILE: PRÉSENT"
    else
        echo "❌ $FILE: MANQUANT"
        ALL_OK=false
    fi
done

if [ "$ALL_OK" = true ]; then
    echo "Tous les fichiers essentiels sont présents!"
    exit 0
else
    echo "Des fichiers essentiels sont manquants, le déploiement peut échouer"
    exit 1
fi
