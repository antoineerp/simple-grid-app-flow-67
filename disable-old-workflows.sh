
#!/bin/bash

# Script pour désactiver temporairement les anciens workflows GitHub
# et garder uniquement le workflow unifié actif

echo "===== Script de désactivation des anciens workflows GitHub ====="

# Dossier des workflows GitHub
WORKFLOW_DIR=".github/workflows"

# Fichiers à conserver actifs (sans l'extension .yml)
KEEP_ACTIVE="deploy-unified"

echo "Le workflow qui restera actif: $KEEP_ACTIVE"
echo ""

# Vérifier si le dossier des workflows existe
if [ ! -d "$WORKFLOW_DIR" ]; then
  echo "Erreur: Le dossier $WORKFLOW_DIR n'existe pas."
  exit 1
fi

# Compter les fichiers avant modification
TOTAL_FILES=$(find $WORKFLOW_DIR -name "*.yml" | wc -l)
echo "Nombre total de workflows trouvés: $TOTAL_FILES"

# Désactiver les anciens workflows
for workflow in $WORKFLOW_DIR/*.yml; do
  filename=$(basename "$workflow" .yml)
  
  # Ne pas désactiver le workflow unifié
  if [ "$filename" != "$KEEP_ACTIVE" ]; then
    # Vérifier si le workflow est déjà désactivé
    if [ ! -f "${workflow}.disabled" ]; then
      echo "Désactivation du workflow: $filename.yml"
      mv "$workflow" "${workflow}.disabled"
    else
      echo "Le workflow $filename.yml est déjà désactivé."
    fi
  else
    echo "Conservation du workflow actif: $filename.yml"
  fi
done

# Compter les fichiers après modification
ACTIVE_FILES=$(find $WORKFLOW_DIR -name "*.yml" | wc -l)
DISABLED_FILES=$(find $WORKFLOW_DIR -name "*.yml.disabled" | wc -l)

echo ""
echo "===== Résumé ====="
echo "Workflows actifs: $ACTIVE_FILES"
echo "Workflows désactivés: $DISABLED_FILES"
echo ""
echo "Pour réactiver un workflow, utilisez la commande:"
echo "mv .github/workflows/nom-du-workflow.yml.disabled .github/workflows/nom-du-workflow.yml"
echo ""
echo "Pour déclencher manuellement le workflow unifié, utilisez l'interface GitHub Actions"
echo "ou la commande curl avec l'API GitHub."

# Vérifier si le workflow unifié existe et est actif
if [ -f "$WORKFLOW_DIR/$KEEP_ACTIVE.yml" ]; then
  echo ""
  echo "✅ Le workflow unifié $KEEP_ACTIVE.yml est prêt à être utilisé."
else
  echo ""
  echo "❌ ERREUR: Le workflow unifié $KEEP_ACTIVE.yml n'a pas été trouvé ou n'est pas actif."
  echo "Vérifiez que le fichier existe dans le dossier $WORKFLOW_DIR"
fi

echo ""
echo "===== Fin du script ====="
