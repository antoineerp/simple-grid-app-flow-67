
#!/bin/bash
# Script pour désactiver les anciens workflows GitHub Actions

echo "=== Désactivation des anciens workflows de déploiement ==="

# Liste des workflows à désactiver
WORKFLOWS_TO_DISABLE=(
  ".github/workflows/deploy.yml"
  ".github/workflows/deploy-simple.yml"
  ".github/workflows/deploy-optimized.yml"
)

# Désactiver les workflows en les renommant
for workflow in "${WORKFLOWS_TO_DISABLE[@]}"; do
  if [ -f "$workflow" ]; then
    mv "$workflow" "${workflow}.disabled"
    echo "✅ Workflow désactivé: $workflow -> ${workflow}.disabled"
  else
    echo "ℹ️ Workflow non trouvé: $workflow"
  fi
done

echo ""
echo "=== Workflow unifié activé ==="
echo "Utilisez le nouveau workflow unifié: .github/workflows/deploy-unified.yml"
echo "Pour réactiver un ancien workflow, retirez l'extension .disabled"
echo ""
