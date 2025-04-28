
<?php
class BaseModel {
    // Propriétés de base
    protected $conn;
    protected $table_name;
    
    // Constructeur
    public function __construct($db, $table_name) {
        $this->conn = $db;
        $this->table_name = $table_name;
    }
    
    // Méthode pour assainir les entrées
    protected function sanitizeInput($input) {
        if (is_array($input)) {
            foreach ($input as $key => $value) {
                $input[$key] = $this->sanitizeInput($value);
            }
        } else {
            $input = htmlspecialchars(strip_tags($input));
        }
        return $input;
    }
    
    // Méthode pour nettoyer les données UTF-8
    protected function cleanUTF8($input) {
        if (is_string($input)) {
            return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
        } elseif (is_array($input)) {
            foreach ($input as $key => $value) {
                $input[$key] = $this->cleanUTF8($value);
            }
        }
        return $input;
    }
}
?>
