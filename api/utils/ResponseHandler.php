
<?php
class ResponseHandler {
    public static function success($data = [], $code = 200) {
        http_response_code($code);
        
        $response = [
            'status' => 'success',
            'code' => $code,
            'data' => $data
        ];
        
        echo json_encode($response);
        exit;
    }
    
    public static function error($message, $code = 500, $details = []) {
        http_response_code($code);
        
        $response = [
            'status' => 'error',
            'code' => $code,
            'message' => $message
        ];
        
        if (!empty($details)) {
            $response['details'] = $details;
        }
        
        echo json_encode($response);
        exit;
    }
}
?>
