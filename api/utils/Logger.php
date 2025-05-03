
<?php
/**
 * Classe simple de journalisation pour les scripts du système
 */
class Logger {
    private $logFile;
    private $name;
    
    /**
     * Initialise un nouveau logger
     * 
     * @param string $name Nom du logger pour identification
     */
    public function __construct($name) {
        $this->name = $name;
        $this->logFile = __DIR__ . '/../logs/' . $name . '_' . date('Y-m-d') . '.log';
        
        // Créer le répertoire de logs s'il n'existe pas
        if (!is_dir(dirname($this->logFile))) {
            mkdir(dirname($this->logFile), 0775, true);
        }
    }
    
    /**
     * Écrit un message d'information dans le journal
     * 
     * @param string $message Message à enregistrer
     */
    public function info($message) {
        $this->log('INFO', $message);
    }
    
    /**
     * Écrit un message d'erreur dans le journal
     * 
     * @param string $message Message d'erreur à enregistrer
     */
    public function error($message) {
        $this->log('ERROR', $message);
        
        // Enregistrer également dans le journal d'erreurs du serveur
        error_log("[{$this->name}] ERROR: {$message}");
    }
    
    /**
     * Écrit un message d'avertissement dans le journal
     * 
     * @param string $message Message d'avertissement à enregistrer
     */
    public function warning($message) {
        $this->log('WARNING', $message);
    }
    
    /**
     * Fonction interne pour formater et écrire dans le journal
     * 
     * @param string $level Niveau de journalisation (INFO, ERROR, WARNING)
     * @param string $message Message à enregistrer
     */
    private function log($level, $message) {
        $date = date('Y-m-d H:i:s');
        $logMessage = "[{$date}] [{$level}] {$message}" . PHP_EOL;
        
        file_put_contents($this->logFile, $logMessage, FILE_APPEND);
    }
}
?>
