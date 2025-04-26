
<?php
require_once dirname(__DIR__) . '/utils/ResponseHandler.php';

abstract class BaseOperations {
    protected $db;
    protected $model;

    public function __construct($db, $model) {
        $this->db = $db;
        $this->model = $model;
    }

    protected function validateData($data, array $requiredFields): bool {
        foreach ($requiredFields as $field) {
            if (!isset($data->$field) || empty($data->$field)) {
                return false;
            }
        }
        return true;
    }
}
?>
