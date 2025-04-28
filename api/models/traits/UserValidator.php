
<?php
trait UserValidator {
    public function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL);
    }
    
    public function validateRole($role) {
        $allowedRoles = ['admin', 'gestionnaire', 'utilisateur', 'visiteur'];
        return in_array($role, $allowedRoles);
    }
    
    public function validatePassword($password) {
        // Minimum 8 caractères, au moins une lettre et un chiffre
        return strlen($password) >= 8 && 
               preg_match('/[A-Za-z]/', $password) && 
               preg_match('/\d/', $password);
    }
    
    public function validateName($name) {
        return strlen(trim($name)) >= 2;
    }
}
?>
