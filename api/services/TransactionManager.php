
<?php
class TransactionManager {
    private $connection;
    private $transactionStarted = false;

    public function __construct($connection) {
        $this->connection = $connection;
    }

    public function beginTransaction() {
        if (!$this->connection || $this->transactionStarted) {
            return false;
        }
        
        try {
            $this->transactionStarted = $this->connection->beginTransaction();
            return $this->transactionStarted;
        } catch (Exception $e) {
            error_log("Erreur lors du démarrage de la transaction: " . $e->getMessage());
            return false;
        }
    }

    public function commitTransaction() {
        if (!$this->connection || !$this->transactionStarted) {
            return false;
        }
        
        try {
            $result = $this->connection->commit();
            $this->transactionStarted = false;
            return $result;
        } catch (Exception $e) {
            error_log("Erreur lors de la validation de la transaction: " . $e->getMessage());
            return false;
        }
    }

    public function rollbackTransaction() {
        if (!$this->connection || !$this->transactionStarted) {
            return false;
        }
        
        try {
            $result = $this->connection->rollBack();
            $this->transactionStarted = false;
            return $result;
        } catch (Exception $e) {
            error_log("Erreur lors de l'annulation de la transaction: " . $e->getMessage());
            return false;
        }
    }

    public function isTransactionActive() {
        return $this->transactionStarted;
    }

    public function finalize() {
        // S'assurer que la transaction est terminée si elle a été démarrée
        if ($this->connection && $this->transactionStarted) {
            try {
                $this->connection->rollBack();
                $this->transactionStarted = false;
            } catch (Exception $e) {
                error_log("Erreur lors de la finalisation de la transaction: " . $e->getMessage());
            }
        }
    }
}
?>
