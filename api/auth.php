
<?php
// Simple redirect script to the AuthController
// This file handles authentication requests and forwards them to the proper controller

// Include the AuthController
require_once 'controllers/AuthController.php';

// Log that this endpoint was called
error_log("auth.php endpoint called, forwarding to AuthController.php");
?>
