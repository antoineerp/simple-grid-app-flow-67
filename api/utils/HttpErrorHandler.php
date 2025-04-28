
<?php
class HttpErrorHandler {
    public static function handleError($code, $message, $details = []) {
        http_response_code($code);
        
        $response = [
            'status' => 'error',
            'code' => $code,
            'message' => $message,
        ];
        
        if (!empty($details)) {
            $response['details'] = $details;
        }
        
        echo json_encode($response);
        exit;
    }
}
?>
