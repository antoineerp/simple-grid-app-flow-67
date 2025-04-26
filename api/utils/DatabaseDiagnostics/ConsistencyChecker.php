
<?php
class ConsistencyChecker {
    public function checkConsistency($config1, $config2) {
        $result = [
            'status' => 'success',
            'is_consistent' => true,
            'message' => 'Les configurations sont cohérentes',
            'differences' => []
        ];
        
        // Vérifier si les configurations sont vides ou invalides
        if (empty($config1) || empty($config2)) {
            $result['is_consistent'] = false;
            $result['status'] = 'error';
            $result['message'] = 'Une ou les deux configurations sont vides ou invalides';
            return $result;
        }
        
        // Normaliser les noms de champs pour la comparaison
        $fieldMappings = [
            'db_name' => ['db_name', 'database', 'dbname'],
            'host' => ['host', 'hostname', 'server'],
            'username' => ['username', 'user', 'uid']
        ];
        
        // Vérifier la cohérence sur les champs clés avec différents noms possibles
        foreach ($fieldMappings as $fieldKey => $possibleNames) {
            // Trouver la valeur dans config1
            $value1 = null;
            foreach ($possibleNames as $name) {
                if (isset($config1[$name])) {
                    $value1 = $config1[$name];
                    break;
                }
            }
            
            // Trouver la valeur dans config2
            $value2 = null;
            foreach ($possibleNames as $name) {
                if (isset($config2[$name])) {
                    $value2 = $config2[$name];
                    break;
                }
            }
            
            // Si les deux valeurs sont définies et différentes, enregistrer la différence
            if ($value1 !== null && $value2 !== null && $value1 !== $value2) {
                $result['is_consistent'] = false;
                $result['status'] = 'warning';
                $result['message'] = 'Différences trouvées entre les configurations';
                
                // Récupérer la différence avec des noms normalisés pour l'affichage
                $displayName = ($fieldKey === 'db_name') ? 'database' : $fieldKey;
                $result['differences'][$displayName] = "Config 1: {$value1}, Config 2: {$value2}";
            }
        }
        
        return $result;
    }
}
?>
