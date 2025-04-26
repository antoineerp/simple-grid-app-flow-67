
<?php
class ConsistencyChecker {
    public function checkConfigConsistency($pdo_config, $database_class_config, $file_config) {
        if ($pdo_config['status'] === 'success' && 
            $database_class_config['status'] === 'success' && 
            $file_config['status'] === 'success') {
            
            $differences = [];
            
            if ($pdo_config['connection_info']['host'] !== $database_class_config['config']['host']) {
                $differences['host'] = "PDO: {$pdo_config['connection_info']['host']} vs DB Class: {$database_class_config['config']['host']}";
            }
            if ($pdo_config['connection_info']['database'] !== $database_class_config['config']['db_name']) {
                $differences['database'] = "PDO: {$pdo_config['connection_info']['database']} vs DB Class: {$database_class_config['config']['db_name']}";
            }
            if ($pdo_config['connection_info']['user'] !== $database_class_config['config']['username']) {
                $differences['username'] = "PDO: {$pdo_config['connection_info']['user']} vs DB Class: {$database_class_config['config']['username']}";
            }
            
            if (!empty($differences)) {
                return [
                    'status' => 'warning',
                    'is_consistent' => false,
                    'message' => 'Incohérences détectées entre les configurations',
                    'differences' => $differences
                ];
            }
            
            return [
                'status' => 'success',
                'is_consistent' => true,
                'message' => 'Les configurations sont cohérentes'
            ];
        }
        
        return [
            'status' => 'error',
            'is_consistent' => false,
            'message' => 'Impossible de vérifier la cohérence (une ou plusieurs connexions ont échoué)'
        ];
    }
}
