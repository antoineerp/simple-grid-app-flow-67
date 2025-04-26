
<?php
require_once dirname(__FILE__) . '/BaseModel.php';
require_once dirname(__FILE__) . '/traits/GlobalConfig.php';

class GlobalConfig extends BaseModel {
    use GlobalConfig;

    public function __construct($db) {
        parent::__construct($db, 'global_config');
    }
}
?>
