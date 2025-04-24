
<?php
class BaseModel {
    protected $conn;
    protected $table_name;

    public function __construct($db, $table_name) {
        $this->conn = $db;
        $this->table_name = $table_name;
    }

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

    protected function sanitizeInput($input) {
        return htmlspecialchars(strip_tags($input));
    }
}
?>
