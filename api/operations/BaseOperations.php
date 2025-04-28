
<?php
class BaseOperations {
    protected $model;
    
    public function __construct($model) {
        $this->model = $model;
    }
    
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
