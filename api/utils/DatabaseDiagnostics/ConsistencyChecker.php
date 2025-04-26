
<?php
class ConsistencyChecker {
    public function checkConsistency($config1, $config2) {
        $result = [
            'status' => 'success',
            'is_consistent' => true,
            'message' => 'Les configurations sont cohérentes',
            'differences' => []
        ];
        
        // Vérifier la cohérence sur les champs clés
        $fields = ['host', 'db_name', 'username'];
        foreach ($fields as $field) {
            $field2 = $field;
            
            // Adapter le nom du champ si nécessaire (config1 utilise db_name, config2 peut utiliser database)
            if ($field === 'db_name' && !isset($config2['db_name']) && isset($config2['database'])) {
                $field2 = 'database';
            }
            
            if (isset($config1[$field]) && isset($config2[$field2]) && $config1[$field] !== $config2[$field2]) {
                $result['is_consistent'] = false;
                $result['status'] = 'warning';
                $result['message'] = 'Différences trouvées entre les configurations';
                
                // Récupérer la différence
                $field_name = ($field === 'db_name') ? 'database' : $field;
                $result['differences'][$field_name] = "Config 1: {$config1[$field]}, Config 2: {$config2[$field2]}";
            }
        }
        
        return $result;
    }
}
?>
