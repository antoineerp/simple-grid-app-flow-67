
<?php
trait UserValidator {
    protected function validateUserData($data) {
        return !empty($data->nom) &&
               !empty($data->prenom) &&
               !empty($data->email) &&
               !empty($data->identifiant_technique) &&
               !empty($data->mot_de_passe) &&
               !empty($data->role);
    }

    protected function validateUpdateData($data) {
        return !empty($data->id) &&
               !empty($data->nom) &&
               !empty($data->prenom) &&
               !empty($data->email) &&
               !empty($data->role);
    }
}
?>
