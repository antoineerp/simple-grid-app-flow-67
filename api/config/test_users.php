
<?php
class TestUsers {
    public static function getUsers(): array {
        return [
            'admin' => ['password' => 'admin123', 'role' => 'admin'],
            'p71x6d_system' => ['password' => 'Trottinette43!', 'role' => 'admin'],
            'antcirier@gmail.com' => ['password' => 'password123', 'role' => 'admin'],
            'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
            'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur']
        ];
    }
}
?>
