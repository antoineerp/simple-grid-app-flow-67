
<?php
class Logger {
    private $logger_name;
    private $log_file;
    
    public function __construct($logger_name) {
        $this->logger_name = $logger_name;
        $this->log_file = __DIR__ . "/../logs/" . $logger_name . ".log";
        
        // S'assurer que le répertoire des logs existe
        $log_dir = __DIR__ . "/../logs";
        if (!is_dir($log_dir)) {
            mkdir($log_dir, 0777, true);
        }
    }
    
    public function info($message) {
        $this->log("INFO", $message);
    }
    
    public function error($message) {
        $this->log("ERROR", $message);
    }
    
    public function warning($message) {
        $this->log("WARNING", $message);
    }
    
    public function debug($message) {
        $this->log("DEBUG", $message);
    }
    
    private function log($level, $message) {
        $timestamp = date('Y-m-d H:i:s');
        $log_entry = "[$timestamp] [$level] [$this->logger_name] $message" . PHP_EOL;
        
        // Écrire dans le fichier de log
        file_put_contents($this->log_file, $log_entry, FILE_APPEND);
        
        // Également envoyer au log système
        error_log("$level [$this->logger_name] $message");
    }
}
?>
